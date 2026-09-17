import { NextResponse } from "next/server";
import { requireAuth } from "../../../../../lib/auth/verifyBearerToken";
import { db } from "../../../../../lib/db";

export async function DELETE(request) {
    const { payload, error, status } = requireAuth(request, "super_admin");
    if (error) {
        return NextResponse.json({ message: error }, { status });
    }

    // user_id diambil dari query string, bukan dari body. Permintaan DELETE
    // umumnya tidak memuat body, sehingga membaca request.json() akan gagal
    // sebelum pemeriksaan apa pun dijalankan, dan jawabannya menjadi 500
    // tanpa keterangan.
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get("user_id");

    if (!user_id) {
        return NextResponse.json(
            { message: "user_id wajib disertakan" },
            { status: 400 }
        );
    }

    try {
        const deletedUser = await db.users.delete({
            where: { user_id },
            select: {
                user_id: true,
                email: true,
            },
        });

        return NextResponse.json(
            { message: "Berhasil menghapus user", data: deletedUser },
            { status: 200 }
        );
    } catch (err) {
        // P2025 berarti barisnya tidak ada. Itu jawaban 404, bukan galat server.
        if (err.code === "P2025") {
            return NextResponse.json(
                { message: "User tidak ditemukan" },
                { status: 404 }
            );
        }
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}
