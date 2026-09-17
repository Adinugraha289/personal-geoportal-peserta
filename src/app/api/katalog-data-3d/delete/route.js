import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { db } from "../../../../../lib/db";
import { requireAuth } from "../../../../../lib/auth/verifyBearerToken";

export async function POST(request) {
    // 1. Validasi Autentikasi
    const { payload, error, status } = requireAuth(request, "admin");
    if (error) {
        return NextResponse.json({ message: error }, { status });
    }

    try {
        const formData = await request.formData();
        const data_3d_id = formData.get("data_3d_id");

        if (!data_3d_id) {
            return NextResponse.json({ message: "ID data tidak boleh kosong" }, { status: 400 });
        }

        // 2. Hapus data dari Database
        const deleteData = await db.katalog_data_3d.delete({
            where: { data_3d_id: data_3d_id }
        });

        // 3. Hapus file fisik di storage server (folder cwd/data/models)
        const uploadDir = path.join(process.cwd(), "data/models");

        if (fs.existsSync(uploadDir)) {
            const files = fs.readdirSync(uploadDir);
            // Cari file yang berawalan data_3d_id (menyesuaikan ekstensi .glb, .zip, dll)
            const targetFileName = files.find((file) => file.startsWith(data_3d_id));

            if (targetFileName) {
                const filePath = path.join(uploadDir, targetFileName);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath); // Hapus file biner
                }
            } else {
                console.warn(`File fisik untuk data_3d_id ${data_3d_id} tidak ditemukan di ${uploadDir}`);
            }
        }

        return NextResponse.json({ message: "Berhasil menghapus data dan file terkait" }, { status: 200 });
    } catch (err) {
        console.error("Error Delete Data 3D:", err);
        if (err.code === "P2025") {
            return NextResponse.json({ message: "Data 3D tidak ditemukan di database" }, { status: 404 });
        }
        return NextResponse.json({ message: err.message || "Terjadi kesalahan pada server" }, { status: 500 });
    }
}