-- =====================================================================
-- Migrasi: hapus peran 'editor', ubah nilai bawaan menjadi 'viewer'
--
-- Diperlukan HANYA bila database Anda sudah terlanjur dibuat memakai
-- versi sql/01-schema.sql yang lama. Alasannya, berkas itu memakai
-- CREATE TABLE IF NOT EXISTS, sehingga menjalankannya kembali TIDAK
-- mengubah tabel yang sudah ada. Nilai bawaan dan batasan peran yang
-- lama akan tetap terpasang.
--
-- Database yang baru dibuat dari sql/01-schema.sql versi terbaru TIDAK
-- memerlukan berkas ini.
--
-- Cara pakai: buka SQL Editor di dashboard Supabase, salin SELURUH isi
-- berkas ini, tempel, lalu klik Run.
--
-- Urutan langkah tidak boleh ditukar. Langkah 3 akan GAGAL bila langkah 1
-- dilewati, karena masih ada baris berperan 'editor' yang melanggar
-- batasan baru.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 1. Periksa keadaan sebelum diubah
--
-- Jalankan bagian ini lebih dahulu untuk melihat apakah migrasi memang
-- diperlukan. Hasil yang diharapkan: jumlah berperan 'editor' dan nilai
-- bawaan kolom role sebelum perubahan.
-- ---------------------------------------------------------------------
SELECT
    'peran yang terpasang' AS keterangan,
    role,
    count(*) AS jumlah
FROM users
GROUP BY role
ORDER BY role;

SELECT
    'nilai bawaan kolom role' AS keterangan,
    column_default
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'role';

-- ---------------------------------------------------------------------
-- 2. Pindahkan pengguna berperan 'editor' menjadi 'viewer'
--
-- Dijalankan SEBELUM batasan diubah. Peran 'editor' tidak lagi dikenal
-- oleh lib/auth/roles.js, sehingga pengguna yang masih memakainya dapat
-- login tetapi ditolak di seluruh endpoint katalog dengan 403.
-- ---------------------------------------------------------------------
UPDATE users
SET role = 'viewer'
WHERE role = 'editor';

-- ---------------------------------------------------------------------
-- 3. Ubah nilai bawaan kolom
-- ---------------------------------------------------------------------
ALTER TABLE users
    ALTER COLUMN role SET DEFAULT 'viewer';

-- ---------------------------------------------------------------------
-- 4. Ganti batasan peran menjadi tiga peran
--
-- DROP lebih dahulu supaya berkas ini aman dijalankan lebih dari sekali.
-- ---------------------------------------------------------------------
ALTER TABLE users
    DROP CONSTRAINT IF EXISTS users_role_valid;

ALTER TABLE users
    ADD CONSTRAINT users_role_valid
    CHECK (role IN ('viewer', 'admin', 'super_admin'));

COMMIT;

-- ---------------------------------------------------------------------
-- 5. Periksa hasilnya
--
-- Harapan:
--   peran        : hanya viewer, admin, dan super_admin
--   nilai bawaan : 'viewer'
--   batasan      : CHECK (role = ANY (ARRAY['viewer','admin','super_admin']))
-- ---------------------------------------------------------------------
SELECT
    'peran setelah migrasi' AS keterangan,
    role,
    count(*) AS jumlah
FROM users
GROUP BY role
ORDER BY role;

SELECT
    'nilai bawaan setelah migrasi' AS keterangan,
    column_default
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'role';

SELECT
    'batasan setelah migrasi' AS keterangan,
    pg_get_constraintdef(oid) AS definisi
FROM pg_constraint
WHERE conname = 'users_role_valid';
