// =====================================================================
// Praktik 9 - versi perbaikan roles.js
//
// Perubahan dari versi modul:
//
//  1. Daftar role yang boleh dibuat/diubah diletakkan di sini, bukan
//     diulang di tiap route. Versi modul menulis
//       create: allowedRoles = ["editor", "admin"]
//       update: allowedRoles = ["viewer", "admin"]
//     sehingga "admin" boleh dibuat tetapi tidak boleh dijadikan hasil
//     update, dan "editor" boleh dibuat tetapi tidak bisa diubah. Dua
//     daftar yang berbeda untuk aturan yang sama pasti akan menyimpang.
//
//  2. hasRequiredRole() dibuat tahan terhadap role yang tidak dikenal.
//     Versi modul: ROLE_LEVELS[userRole] bernilai undefined untuk role
//     tak dikenal, lalu undefined >= 1 menghasilkan false — kebetulan
//     aman, tetapi tidak jelas disengaja. Di sini dinyatakan eksplisit.
//
//  3. Ada helper isRoleDikenal() supaya validasi role tidak perlu
//     menuliskan daftar ulang.
// =====================================================================

// Semakin besar angka semakin banyak hak yang didapat.
// super_admin bisa melakukan semuanya tanpa batasan.
// admin tidak bisa melakukan hal yang dikhususkan super_admin.
// viewer tidak bisa melakukan hal yang dikhususkan admin dan super_admin.
export const ROLE_LEVELS = Object.freeze({
    viewer: 1,
    editor: 2,
    admin: 3,
    super_admin: 4,
});

// Role yang boleh dibuat lewat API create.
export const ROLE_DAPAT_DIBUAT = Object.freeze(["viewer", "editor", "admin"]);

// Role yang boleh dihasilkan lewat API update.
export const ROLE_DAPAT_DIUBAH = Object.freeze(["viewer", "editor", "admin"]);

export function isRoleDikenal(role) {
    return typeof role === "string" && Object.hasOwn(ROLE_LEVELS, role);
}

/**
 * @param {string} userRole     role yang dimiliki pengguna
 * @param {string} requiredRole role minimum yang dibutuhkan
 */
export function hasRequiredRole(userRole, requiredRole) {
    // Role yang tidak dikenal tidak pernah memenuhi syarat apa pun.
    // Dinyatakan eksplisit supaya tidak bergantung pada perilaku
    // perbandingan undefined.
    if (!isRoleDikenal(userRole) || !isRoleDikenal(requiredRole)) return false;
    return ROLE_LEVELS[userRole] >= ROLE_LEVELS[requiredRole];
}
