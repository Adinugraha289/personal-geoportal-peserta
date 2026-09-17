import { NextResponse } from "next/server";
import { Pool } from "pg";
import crypto from "crypto";
import { db } from "../../../../../lib/db"; // Pastikan Prisma Client kamu di-import di sini
import { requireAuth } from "../../../../../lib/auth/verifyBearerToken";

const pool = new Pool({
    host: process.env.POSTGIS_HOST,
    port: parseInt(process.env.POSTGIS_PORT),
    user: process.env.POSTGIS_USER,
    password: process.env.POSTGIS_PASSWORD,
    database: process.env.POSTGIS_DB,
});

const DB_SCHEMA = process.env.POSTGIS_SCHEMA;

export async function POST(request) {
    // 1. Validasi Autentikasi (Tambahkan parameter `request`)
    const { payload, error, status } = requireAuth(request, "admin");
    console.log(payload);
    if (error) {
        return NextResponse.json({ message: error }, { status });
    }
    const client = await pool.connect();

    try {
        const formData = await request.formData();
        const file = formData.get("file");
        const layerNameInput = formData.get("layer_name");
        const akses = formData.get("akses"); // 'public' | 'private'
        const isEditable = formData.get("editable") === "true"; // boolean

        if (!file || typeof file === "string") {
            return NextResponse.json({ error: "File GeoJSON tidak ditemukan" }, { status: 400 });
        }

        const fileText = await file.text();
        let geojson;
        try {
            geojson = JSON.parse(fileText);
        } catch (e) {
            return NextResponse.json({ error: "Format GeoJSON tidak valid" }, { status: 400 });
        }

        const features = geojson.type === "FeatureCollection" ? geojson.features : [geojson];
        if (!features || features.length === 0) {
            return NextResponse.json({ error: "GeoJSON kosong" }, { status: 400 });
        }

        // 2. Ambil nama properti GeoJSON & ubah jadi lowercase
        const rawSampleProps = features[0]?.properties || {};
        const propMap = {};
        Object.keys(rawSampleProps).forEach(rawKey => {
            const cleanKey = rawKey.replace(/[^a-zA-Z0-9_]/g, "_").toLowerCase();
            propMap[cleanKey] = rawKey;
        });

        const cleanPropKeys = Object.keys(propMap);

        // 3. Buat Nama Tabel Unik di PostGIS
        const uniqueId = crypto.randomUUID().slice(0, 8);
        const tableName = `${layerNameInput.replace(/[^a-zA-Z0-9_]/g, "_")}_${uniqueId}`.toLowerCase();

        await client.query("BEGIN");

        const columnsSql = cleanPropKeys.length > 0
            ? cleanPropKeys.map(k => `"${k}" TEXT`).join(", ") + ","
            : "";

        // 4. Buat Tabel di PostGIS Schema "gis"
        await client.query(`
      CREATE TABLE "${DB_SCHEMA}"."${tableName}" (
        id SERIAL PRIMARY KEY,
        ${columnsSql}
        the_geom GEOMETRY(Geometry, 4326)
      );
    `);

        // 5. Insert Data Geometri ke PostGIS
        for (const feature of features) {
            const props = feature.properties || {};
            const colNames = ["the_geom"];
            const colValues = ["ST_SetSRID(ST_GeomFromGeoJSON($1), 4326)"];
            const queryParams = [JSON.stringify(feature.geometry)];

            let paramIdx = 2;
            for (const cleanKey of cleanPropKeys) {
                const originalKey = propMap[cleanKey];
                colNames.push(`"${cleanKey}"`);
                colValues.push(`$${paramIdx}`);

                const val = props[originalKey];
                queryParams.push(val !== undefined && val !== null ? String(val) : null);
                paramIdx++;
            }

            await client.query(
                `INSERT INTO "${DB_SCHEMA}"."${tableName}" (${colNames.join(", ")}) VALUES (${colValues.join(", ")})`,
                queryParams
            );
        }

        // Indeks Spasial
        await client.query(`CREATE INDEX ON "${DB_SCHEMA}"."${tableName}" USING GIST (the_geom);`);

        // Hitung Bounding Box Real
        const bboxResult = await client.query(`
      SELECT 
        ST_XMin(ST_Extent(the_geom)) as minx,
        ST_YMin(ST_Extent(the_geom)) as miny,
        ST_XMax(ST_Extent(the_geom)) as maxx,
        ST_YMax(ST_Extent(the_geom)) as maxy
      FROM "${DB_SCHEMA}"."${tableName}";
    `);

        await client.query("COMMIT");

        const { minx, miny, maxx, maxy } = bboxResult.rows[0];

        // 6. Publish Ke GeoServer
        const geoserverUrl = process.env.GEOSERVER_URL;
        const workspace = process.env.GEOSERVER_WORKSPACE;
        const existingDatastore = process.env.GEOSERVER_POSTGIS_DATASTORE;
        const auth = Buffer.from(`${process.env.GEOSERVER_USERNAME}:${process.env.GEOSERVER_PASSWORD}`).toString("base64");

        const publishBody = {
            featureType: {
                name: tableName,
                nativeName: tableName,
                title: layerNameInput,
                srs: "EPSG:4326",
                nativeCRS: "EPSG:4326",
                projectionPolicy: "FORCE_DECLARED",
                enabled: true,
                advertised: true,
                metadata: {
                    entry: [
                        { "@key": "disable.wfs.transactions", "$": (!isEditable).toString() }
                    ]
                },
                nativeBoundingBox: { minx: parseFloat(minx), maxx: parseFloat(maxx), miny: parseFloat(miny), maxy: parseFloat(maxy), crs: "EPSG:4326" },
                latLonBoundingBox: { minx: parseFloat(minx), maxx: parseFloat(maxx), miny: parseFloat(miny), maxy: parseFloat(maxy), crs: "EPSG:4326" }
            }
        };

        const publishUrl = `${geoserverUrl}/rest/workspaces/${workspace}/datastores/${existingDatastore}/featuretypes`;

        const publishResponse = await fetch(publishUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Basic ${auth}`,
            },
            body: JSON.stringify(publishBody),
        });

        if (!publishResponse.ok) {
            const publishErr = await publishResponse.text();
            throw new Error(`Gagal Publish ke GeoServer: ${publishErr}`);
        }

        // 6. Terapkan security layer
        await applyGeoServerLayerSecurity({
            geoserverUrl,
            workspace,
            tableName,
            akses,
            isEditable,
            auth,
        });

        // 7. Tentukan URL WMS dan WFS
        const wmsUrl = `${geoserverUrl}/${workspace}/wms`;
        const wfsUrl = `${geoserverUrl}/${workspace}/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=${workspace}:${tableName}&outputFormat=application/json`;

        // 8. Simpan Record ke Tabel katalog_data_2d & Include Data Author
        const newKatalogData = await db.katalog_data_2d.create({
            data: {
                data_2d_id: crypto.randomUUID(),
                layer_name: `${workspace}:${tableName}`,
                akses: akses,
                is_editable: isEditable,
                wms_url: wmsUrl,
                wfs_url: wfsUrl,
                author: payload.user_id, // Tetap gunakan user_id sebagai FK
            },
            select: {
                data_2d_id: true,
                layer_name: true,
                akses: true,
                is_editable: true,
                wms_url: true,
                wfs_url: true,
                users: {
                    select: {
                        email: true,
                    },
                },
            },
        });

        return NextResponse.json({
            success: true,
            message: `Layer ${layerNameInput} berhasil disimpan ke Katalog & GeoServer!`,
            data: newKatalogData,
        });
    } catch (error) {
        await client.query("ROLLBACK");
        return NextResponse.json({ error: error.message }, { status: 500 });
    } finally {
        client.release();
    }
}


async function applyGeoServerLayerSecurity({ geoserverUrl, workspace, tableName, akses, isEditable, auth }) {
    // Tentukan role yang diberi izin Read & Write
    // Jika akses 'private', hanya ADMIN yang bisa Read. Jika 'public', ROLE_ANONYMOUS & ADMIN bisa Read.
    const readRoles = akses === "private" ? ["ADMIN"] : ["ROLE_ANONYMOUS", "ADMIN"];

    // Jika isEditable = true, beri akses Write ke ADMIN (atau role editor sesuai kebutuhan aplikasi)
    const writeRoles = isEditable ? ["ADMIN"] : [];

    const layerPattern = `${workspace}.${tableName}`;

    // Rule Read
    if (readRoles.length > 0) {
        await fetch(`${geoserverUrl}/rest/security/acl/layers`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Basic ${auth}`,
            },
            body: JSON.stringify({
                [`${layerPattern}.r`]: readRoles.join(","),
            }),
        });
    }

    // Rule Write
    if (writeRoles.length > 0) {
        await fetch(`${geoserverUrl}/rest/security/acl/layers`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Basic ${auth}`,
            },
            body: JSON.stringify({
                [`${layerPattern}.w`]: writeRoles.join(","),
            }),
        });
    }
}