import { NextResponse } from "next/server";
import { db } from "../../../../../lib/db";
import { requireAuth } from "../../../../../lib/auth/verifyBearerToken";

export async function GET(request) {
    const { payload, error, status } = requireAuth(request, "super_admin"); // pengecekan apakah token yang dimasukan adalah token super_admin
    if (error) {
        return NextResponse.json({ message: error }, { status });
    }

    try {
        const users = await db.users.findMany({ // ambil data user dari table users
            select: {
                user_id: true,
                nama: true,
                email: true,
                role: true,
                is_active: true,
            },
        });

        return NextResponse.json(
            { message: "Berhasil mengambil data user", data: users },
            { status: 200 }
        );
    } catch (error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}