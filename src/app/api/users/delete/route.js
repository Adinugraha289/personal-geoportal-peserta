import { NextResponse } from "next/server";
import { requireAuth } from "../../../../../lib/auth/verifyBearerToken";
import { db } from "../../../../../lib/db";

export async function POST(request) {
    const { payload, error, status } = requireAuth(request, "super_admin");
    if (error) {
        return NextResponse.json({ message: error }, { status });
    }

    const data = await request.json();

    try {
        const deletedUser = await db.users.delete({
            where: { user_id: data.user_id },
            select: {
                user_id: true,
                email: true
            }
        });

        return NextResponse.json({ message: "Berhasil menghapus user", data: deletedUser }, { status: 200 });

    } catch (err) {
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}