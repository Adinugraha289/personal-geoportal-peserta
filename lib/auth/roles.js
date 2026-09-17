// =====================================================================
// Aturan peran dan hak akses.
//
// Tiga peran, berjenjang dari yang paling sedikit haknya:
//
//   viewer       boleh membaca katalog yang boleh dilihatnya
//   admin        boleh menambah, mengubah, dan menghapus katalog
//   super_admin  boleh mengelola akun pengguna
//
// Tidak ada peran lain. Sempat ada "editor" pada versi sebelumnya, dan
// peran itu tidak pernah dikenal oleh ROLE_LEVELS sehingga tidak punya
// hak apa pun. Peran itu sudah dihapus dari seluruh sistem.
//
// Daftar peran yang boleh dibuat dan diubah diletakkan di berkas ini,
// bukan diulang di tiap route. Versi lama menulis daftar berbeda pada
// create dan update, sehingga "admin" boleh dibuat tetapi tidak boleh
// dijadikan hasil update. Dua daftar berbeda untuk aturan yang sama
// pasti akan menyimpang.
// =====================================================================

// Semakin besar angka semakin banyak hak yang didapat.
// super_admin bisa melakukan semuanya tanpa batasan.
// admin tidak bisa melakukan hal yang dikhususkan super_admin.
// viewer tidak bisa melakukan hal yang dikhususkan admin dan super_admin.
export const ROLE_LEVELS = Object.freeze({
    viewer: 1,
    admin: 2,
    super_admin: 3,
});

// Peran yang boleh dibuat lewat API create dan dihasilkan lewat API update.
// super_admin sengaja tidak ada di sini, supaya peran tertinggi tidak dapat
// diberikan lewat API. Peran itu hanya lahir dari sql/02-seed-super-admin.sql.
export const ROLE_DAPAT_DIBUAT = Object.freeze(["viewer", "admin"]);
export const ROLE_DAPAT_DIUBAH = Object.freeze(["viewer", "admin"]);

// Peran bawaan untuk pengguna yang mendaftar sendiri.
export const ROLE_BAWAAN = "viewer";

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
