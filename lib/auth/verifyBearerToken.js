import { verifyAccessToken } from "./jwt";
import { hasRequiredRole } from "./roles";

// Extract token dari header "Authorization: Bearer <token>"
export function getBearerToken(request) {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) return null;
    return authHeader.split(" ")[1];
}

// Extract token dari URL search parameters (contoh: ?access_token=xyz)
export function getTokenParams(request) {
    const { searchParams } = new URL(request.url);
    return searchParams.get("access_token");
}

export function requireAuth(request, minRole = null) {
    // 1. Ambil token dari Bearer Header ATAU dari Query Params
    const token = getBearerToken(request) || getTokenParams(request);

    // 2. Jika kedua sumber token tidak ditemukan
    if (!token) {
        return { error: "Unauthorized: Token tidak ditemukan", status: 401 };
    }

    try {
        // 3. Validasi token (menggunakan variabel `token` yang sudah diekstrak)
        const payload = verifyAccessToken(token);

        // 4. Cek hirarki role jika parameter minRole disediakan
        if (minRole && !hasRequiredRole(payload.role, minRole)) {
            return { error: "Forbidden: Akses ditolak", status: 403 };
        }

        // 5. Kembalikan payload jika berhasil
        return { payload };
    } catch (err) {
        return { error: "Invalid or expired token", status: 401 };
    }
}