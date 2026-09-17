import { NextResponse } from "next/server";
import { verifyCredentials } from "../../../../../lib/auth/verifyCredentials";
import { signAccessToken } from "../../../../../lib/auth/jwt";

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email dan password wajib diisi!" },
        { status: 400 }
      );
    }

    const user = await verifyCredentials(email, password);
    const accessToken = signAccessToken(user);

    return NextResponse.json(
      {
        message: "Login berhasil",
        access_token: accessToken,
        user: { id: user.user_id, email: user.email, role: user.role },
      },
      { status: 200 }
    );
  } catch (error) {
    const status = error.message.includes("aktivasi") ? 403 : 401;
    return NextResponse.json({ message: error.message }, { status });
  }
}