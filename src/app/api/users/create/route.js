import { NextResponse } from "next/server";
import { requireAuth } from "../../../../../lib/auth/verifyBearerToken";
import { db } from "../../../../../lib/db";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export async function POST(request) {
    const { payload, error, status } = requireAuth(request, "super_admin");
    if (error) {
        return NextResponse.json({ message: error }, { status });
    }

    const data = await request.json();
    const allowedRoles = ["editor", "admin"]; // daftar role yang diizinkan untuk dibuat

    if (data.role && !allowedRoles.includes(data.role)) {
        return NextResponse.json({ message: "Role tidak valid" }, { status: 400 });
    }

    const password = bcrypt.hashSync(data.password, 10);

    const isAlreadyExists = await db.users.findFirst({
        where: { email: data.email },
    });

    if (isAlreadyExists) {
        return NextResponse.json({ message: "Email sudah terdaftar" }, { status: 400 });
    }

    try {
        const newUser = await db.users.create({
            data: {
                user_id: crypto.randomUUID(),
                email: data.email,
                nama: data.nama,
                password: password,
                role: data.role,
                is_active: data.is_active,
            },
        });

        return NextResponse.json(
            { message: "Berhasil membuat user baru", data: newUser },
            { status: 201 }
        );

    } catch (err) {
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}