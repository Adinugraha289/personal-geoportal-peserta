import { NextResponse } from "next/server";
import { db } from "../../../../../lib/db";
import bcrypt from "bcryptjs";

export async function POST(request) {
    try {
        const data = await request.json();

        // 1. Validasi sederhana input data
        if (!data.email || !data.password || !data.nama) {
            return NextResponse.json(
                { message: "Nama, email, dan password wajib diisi!" },
                { status: 400 }
            );
        }

        // 2. Cek apakah email sudah terdaftar di database
        const existingUser = await db.users.findUnique({
            where: {
                email: data.email,
            },
        });

        if (existingUser) {
            return NextResponse.json(
                { message: "Email sudah terdaftar. Silakan gunakan email lain!" },
                { status: 400 } // Status 400 Bad Request / 409 Conflict
            );
        }

        // 3. Hash password dan generate UUID
        const hashedPassword = await bcrypt.hash(data.password, 10);
        const user_id = crypto.randomUUID();

        // 4. Simpan user baru ke database
        const registerUser = await db.users.create({
            data: {
                user_id: user_id,
                nama: data.nama,
                email: data.email,
                password: hashedPassword,
                role: "editor", // Default role
                is_active: false, // Default status non-aktif
            },
        });

        return NextResponse.json(
            { message: "Berhasil mendaftar" },
            { status: 201 }
        );
    } catch (err) {
        return NextResponse.json(
            { message: err.message || "Terjadi kesalahan pada server" },
            { status: 500 }
        );
    }
}