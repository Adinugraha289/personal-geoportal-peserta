import { NextResponse } from "next/server";
import { Pool } from "pg";
import { db } from "../../../../../lib/db"; // Pastikan Prisma Client kamu di-import di sini

const pool = new Pool({
    host: process.env.POSTGIS_HOST,
    port: parseInt(process.env.POSTGIS_PORT),
    user: process.env.POSTGIS_USER,
    password: process.env.POSTGIS_PASSWORD,
    database: process.env.POSTGIS_DB,
});

const DB_SCHEMA = process.env.POSTGIS_SCHEMA;

/**
 * DELETE /api/.../[id]  (atau sesuaikan dengan cara kamu mengambil id)
 * Body / query harus berisi: data_2d_id
 *
 * Urutan operasi (kebalikan dari proses create):
 * 1. Ambil record katalog_data_2d berdasarkan data_2d_id -> dapat layer_name (workspace:tableName)
 * 2. Hapus featureType + layer dari GeoServer
 * 3. DROP TABLE fisik di PostGIS (schema DB_SCHEMA)
 * 4. Hapus record dari katalog_data_2d
 *
 * Catatan penting:
 * - Karena operasi melibatkan 2 sistem berbeda (GeoServer via REST, Postgres via SQL)
 *   yang tidak bisa di-rollback lintas sistem, urutan di atas dipilih supaya:
 *   jika GeoServer gagal dihapus, data di database TIDAK ikut terhapus
 *   (state masih konsisten, bisa di-retry).
 * - Jika GeoServer mengembalikan 404 (resource sudah tidak ada), tetap lanjut
 *   membersihkan DB, supaya "orphan record" tidak nyangkut di katalog.
 */
export async function DELETE(request) {
    let dataId;

    try {
        // Ambil id dari query string ?data_2d_id=xxx atau dari body JSON
        const { searchParams } = new URL(request.url);
        dataId = searchParams.get("data_2d_id");

        if (!dataId) {
            const body = await request.json().catch(() => ({}));
            dataId = body.data_2d_id;
        }

        if (!dataId) {
            return NextResponse.json(
                { error: "data_2d_id wajib diisi" },
                { status: 400 }
            );
        }

        // 1. Ambil record katalog
        const katalog = await db.katalog_data_2d.findUnique({
            where: { data_2d_id: dataId },
        });

        if (!katalog) {
            return NextResponse.json(
                { error: "Layer tidak ditemukan di katalog" },
                { status: 404 }
            );
        }

        // layer_name tersimpan sebagai "workspace:tableName"
        const [workspaceFromCatalog, tableName] = katalog.layer_name.split(":");

        if (!tableName) {
            return NextResponse.json(
                { error: "Format layer_name pada katalog tidak valid" },
                { status: 500 }
            );
        }

        const geoserverUrl = process.env.GEOSERVER_URL;
        const workspace = process.env.GEOSERVER_WORKSPACE;
        const existingDatastore = process.env.GEOSERVER_POSTGIS_DATASTORE;
        const auth = Buffer.from(
            `${process.env.GEOSERVER_USERNAME}:${process.env.GEOSERVER_PASSWORD}`
        ).toString("base64");

        // 2. Hapus featureType (sekaligus layer-nya) dari GeoServer
        // recurse=true -> ikut menghapus resource layer yang terkait di GeoServer
        // (TIDAK menghapus tabel fisik di PostGIS, itu kita handle manual di langkah 3)
        const deleteFeatureTypeUrl = `${geoserverUrl}/rest/workspaces/${workspace}/datastores/${existingDatastore}/featuretypes/${tableName}?recurse=true`;

        const gsResponse = await fetch(deleteFeatureTypeUrl, {
            method: "DELETE",
            headers: {
                Authorization: `Basic ${auth}`,
            },
        });

        // Jika gagal dan BUKAN karena resource memang sudah tidak ada (404),
        // hentikan proses -> jangan sentuh database dulu.
        if (!gsResponse.ok && gsResponse.status !== 404) {
            const gsErr = await gsResponse.text();
            return NextResponse.json(
                { error: `Gagal menghapus layer dari GeoServer: ${gsErr}` },
                { status: 502 }
            );
        }

        // 3 & 4. Drop tabel fisik + hapus record katalog dalam satu transaksi DB
        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            await client.query(
                `DROP TABLE IF EXISTS "${DB_SCHEMA}"."${tableName}";`
            );

            await client.query("COMMIT");
        } catch (dbErr) {
            await client.query("ROLLBACK");
            throw dbErr;
        } finally {
            client.release();
        }

        // Hapus record katalog via Prisma
        await db.katalog_data_2d.delete({
            where: { data_2d_id: dataId },
        });

        return NextResponse.json({
            success: true,
            message: `Layer ${katalog.layer_name} berhasil dihapus dari GeoServer & Katalog!`,
        });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}