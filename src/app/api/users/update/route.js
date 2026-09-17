import { NextResponse } from "next/server";
import { requireAuth } from "../../../../../lib/auth/verifyBearerToken";
import { db } from "../../../../../lib/db";

export async function POST(request) {
    const { payload, error, status } = requireAuth(request, "super_admin");
    if (error) {
        return NextResponse.json({ message: error }, { status });
    }

    const data = await request.json();

    // Validasi role yang diizinkan untuk diperbarui
    const allowedRoles = ["viewer", "admin"]; // daftar role yang diizinkan untuk diperbarui
    if (data.role && !allowedRoles.includes(data.role)) {
        return NextResponse.json({ message: "Role tidak valid" }, { status: 400 });
    }

    // Validasi apakah user_id ada di database
    const isExists = await db.users.findFirst({
        where: { user_id: data.user_id },
    });
    if (!isExists) {
        return NextResponse.json({ message: "User tidak ditemukan" }, { status: 404 });
    }

    try {
        const user = await db.users.update({
            where: { user_id: data.user_id },
            data: {
                role: data.role,
                is_active: data.is_active,
            },
            select: {
                user_id: true,
                email: true,
                role: true,
                is_active: true,
            },
        });

        return NextResponse.json(
            { message: "Berhasil memperbarui data user", data: user },
            { status: 200 }
        );
    } catch (err) {
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}