import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const basePath = "/portal";

export default async function proxy(req) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    const signInUrl = new URL(`${basePath}/login`, req.url);
    signInUrl.searchParams.set("callbackUrl", req.url);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/internal/:path*"],
};