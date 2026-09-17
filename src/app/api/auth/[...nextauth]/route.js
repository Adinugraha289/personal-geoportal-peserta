import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { verifyCredentials } from "../../../../../lib/auth/verifyCredentials";
import { signAccessToken } from "../../../../../lib/auth/jwt";

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
            // 2. Cek apakah Custom Bearer Token sudah expired/invalid
            try {
                verifyAccessToken(token.accessToken); // Cek validitas
            } catch (err) {
                // Jika expired, buat ulang Bearer Token baru menggunakan data user dari token NextAuth
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