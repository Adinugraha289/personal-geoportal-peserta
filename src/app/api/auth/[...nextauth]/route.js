import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { verifyCredentials } from "../../../../../lib/auth/verifyCredentials";
import { signAccessToken, verifyAccessToken } from "../../../../../lib/auth/jwt";

export const authOptions = {
    providers: [
        Credentials({
            id: "geoportal-credential",
            name: "geoportal-credential",
            credentials: {
                email: { label: "Email", type: "text" }, // email yang user masukan di halaman login
                password: { label: "Password", type: "password" }, // password yang user masukan di halaman login
            },
            authorize: async (credentials) => {
                try {
                    const user = await verifyCredentials(credentials.email, credentials.password); //validasi email dan password
                    const accessToken = signAccessToken(user);
                    return {
                        id: user.user_id, // NextAuth membutuhkan properti `id`
                        user_id: user.user_id,
                        email: user.email,
                        role: user.role,
                        accessToken
                    };
                } catch (err) {
                    throw new Error(err.message || "Terjadi kesalahan server");
                }
            },
        }),
    ],
    session: { strategy: "jwt", maxAge: 60 * 60 }, // 1 Jam
    callbacks: {
        async jwt({ token, user }) {
            // 1. Saat pertama kali login
            if (user) {
                token.user_id = user.user_id;
                token.email = user.email;
                token.role = user.role;
                token.accessToken = user.accessToken;
                return token;
            }
            // 2. Periksa apakah Bearer token masih berlaku.
            //
            // Dua hal yang ditangani di sini: token yang sudah lewat masa
            // berlaku, dan token yang tanda tangannya tidak sah. Keduanya
            // wajar terjadi, dan keduanya dijawab dengan membuat token baru
            // memakai data pengguna dari token NextAuth yang sudah
            // diverifikasi.
            //
            // Galat lain sengaja dilempar, tidak ditelan. Sebelumnya catch
            // ini menangkap SEMUA galat, sehingga kesalahan seperti fungsi
            // yang salah tulis ikut dianggap token kedaluwarsa dan tidak
            // pernah muncul di log.
            try {
                verifyAccessToken(token.accessToken);
            } catch (err) {
                const wajar =
                    err?.name === "TokenExpiredError" ||
                    err?.name === "JsonWebTokenError";

                if (!wajar) {
                    throw err;
                }

                token.accessToken = signAccessToken({
                    user_id: token.user_id,
                    email: token.email,
                    role: token.role,
                });
            }
            return token;
        },
        async session({ session, token }) {
            session.user.id = token.id;
            session.user.email = token.email;
            session.user.role = token.role;
            session.accessToken = token.accessToken;
            return session;
        },
    },
    pages: { signIn: "/login" },
    secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };