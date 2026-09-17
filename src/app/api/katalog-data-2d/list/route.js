import { NextResponse } from "next/server";
import { requireAuth } from "../../../../../lib/auth/verifyBearerToken";
import { db } from "../../../../../lib/db";

export async function GET(request) {
    // 1. Validasi Autentikasi (Tambahkan parameter `request`)
    const { payload, error, status } = requireAuth(request, "editor");
    if (error) {
        return NextResponse.json({ message: error }, { status });
    }

    try {
        // 2. Query Data dari Database
        const data = await db.katalog_data_2d.findMany({
            select: {
                data_2d_id: true,
                layer_name: true,
                akses: true,
                is_editable: true,
                wms_url: true,
                wfs_url: true,
                users: {
                    select: {
                        email: true
                    }
                }
            }
        });

        // 3. Return Response Sukses
        return NextResponse.json({
            message: "Berhasil mengambil daftar katalog 2D",
            data: data,
        });
    } catch (err) {
        return NextResponse.json(
            { message: err.message || "Terjadi kesalahan pada server" },
            { status: 500 }
        );
    }
}