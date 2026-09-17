import bcrypt from "bcryptjs";
import { db } from "../db";

export async function verifyCredentials(email, password) {
    const user = await db.users.findFirst({ where: { email } });

    if (!user) {
        throw new Error("Email atau password salah!");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        throw new Error("Email atau password salah!");
    }

    if (!user.is_active) {
        throw new Error(
            "Akun anda belum di aktivasi. Silahkan request aktivasi ke email arimatiur@gmail.com"
        );
    }

    return {
        user_id: user.user_id,
        email: user.email,
        role: user.role // pastikan table users sudah memiliki kolom role
    };
}