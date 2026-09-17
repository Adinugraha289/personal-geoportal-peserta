import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { db } from "../../../../../../lib/db";
import { requireAuth } from "../../../../../../lib/auth/verifyBearerToken";

export async function GET(request, { params }) {
    try {
        const { data_3d_id } = await params;

        if (!data_3d_id) {
            return NextResponse.json(
                { message: "ID data 3D tidak ditemukan" },
                { status: 400 }
            );
        }

        // 1. Verifikasi keberadaan record di database
        const item = await db.katalog_data_3d.findUnique({
            where: { data_3d_id: data_3d_id },
        });

        // PERBAIKAN 1: Cek keberadaan item TERLEBIH DAHULU
        if (!item) {
            return NextResponse.json(
                { message: "Data 3D tidak ditemukan di database" },
                { status: 404 }
            );
        }

        // PERBAIKAN 2: Normalisasi huruf kecil (.toLowerCase()) untuk mengantisipasi "Private" / "PRIVATE"
        if (item.akses?.toLowerCase() === "private") {
            const { payload, error, status } = requireAuth(request, "viewer");
            if (error) {
                return NextResponse.json({ message: error }, { status });
            }
        }

        // 2. Cari file di folder /data yang diawali dengan data_3d_id
        const uploadDir = path.join(process.cwd(), "data/models");

        if (!fs.existsSync(uploadDir)) {
            return NextResponse.json(
                { message: "Folder penyimpanan data tidak ditemukan" },
                { status: 404 }
            );
        }

        // Ambil semua file di direktori data dan cari file yang namanya diawali data_3d_id
        const files = fs.readdirSync(uploadDir);
        const targetFileName = files.find((file) => file.startsWith(data_3d_id));

        if (!targetFileName) {
            return NextResponse.json(
                { message: "File fisik 3D tidak ditemukan di server" },
                { status: 404 }
            );
        }

        const filePath = path.join(uploadDir, targetFileName);
        const ext = path.extname(targetFileName).toLowerCase();

        // 3. Tentukan Content-Type berdasarkan ekstensi file
        let contentType = "application/octet-stream";
        if (ext === ".glb") {
            contentType = "model/gltf-binary";
        } else if (ext === ".gltf") {
            contentType = "model/gltf+json";
        } else if (ext === ".zip") {
            contentType = "application/zip";
        }

        // 4. Stream file menggunakan Web ReadableStream agar hemat memori server
        const fileStats = fs.statSync(filePath);
        const nodeStream = fs.createReadStream(filePath);

        const stream = new ReadableStream({
            start(controller) {
                nodeStream.on("data", (chunk) => controller.enqueue(chunk));
                nodeStream.on("end", () => controller.close());
                nodeStream.on("error", (err) => controller.error(err));
            },
        });

        return new NextResponse(stream, {
            status: 200,
            headers: {
                "Content-Type": contentType,
                "Content-Length": fileStats.size.toString(),
                "Content-Disposition": `inline; filename="${targetFileName}"`,
                "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
                "Pragma": "no-cache",
                "Expires": "0",
            },
        });
    } catch (error) {
        console.error("Error serving 3D model:", error);
        return NextResponse.json(
            { message: "Terjadi kesalahan pada server", error: error.message },
            { status: 500 }
        );
    }
}