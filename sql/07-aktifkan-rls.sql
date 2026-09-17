-- =====================================================================
-- Aktifkan Row Level Security pada ketiga tabel
--
-- Diperlukan HANYA bila tabel Anda dibuat sebelum 01-schema.sql memuat
-- perintah RLS. Database yang baru dibuat dari versi terbaru tidak
-- memerlukan berkas ini.
--
-- MENGAPA INI PENTING
--
-- Supabase menyediakan REST API otomatis untuk setiap tabel di schema
-- public. Kunci anon yang dipakai API itu memang dirancang untuk dipakai
-- di sisi peramban, sehingga nilainya tidak dianggap rahasia. Yang
-- mencegah penyalahgunaan adalah Row Level Security, bukan kerahasiaan
-- kunci tersebut.
--
-- Diuji pada project Supabase sungguhan, dengan tabel yang belum ber-RLS:
--
--   peran anon dapat membaca kolom password, dan memiliki izin SELECT,
--   INSERT, UPDATE, DELETE, serta TRUNCATE pada tabel users.
--
-- Artinya siapa pun yang memegang kunci anon dapat membaca seluruh akun
-- beserta hash kata sandinya, dan dapat mengubah atau menghapusnya.
--
-- SETELAH RLS
--
--   peran anon dan authenticated tidak melihat satu baris pun.
--   Aplikasi tetap berjalan normal, karena koneksi Prisma memakai peran
--   postgres yang merupakan PEMILIK tabel, dan pemilik tabel melewati RLS
--   secara bawaan.
--
-- RLS tanpa policy berarti menutup akses bagi semua peran selain pemilik.
-- Itu memang yang diinginkan: seluruh akses data dilakukan lewat API
-- aplikasi sendiri, yang sudah memeriksa token dan peran pengguna.
--
-- Cara pakai: buka SQL Editor di dashboard Supabase, salin SELURUH isi
-- berkas ini, tempel, lalu klik Run.
-- =====================================================================

BEGIN;

ALTER TABLE users           ENABLE ROW LEVEL SECURITY;
ALTER TABLE katalog_data_2d ENABLE ROW LEVEL SECURITY;
ALTER TABLE katalog_data_3d ENABLE ROW LEVEL SECURITY;

COMMIT;

-- ---------------------------------------------------------------------
-- Periksa hasilnya. Ketiga baris harus bernilai true.
-- ---------------------------------------------------------------------
SELECT
    c.relname        AS tabel,
    c.relrowsecurity AS rls
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relname IN ('users', 'katalog_data_2d', 'katalog_data_3d')
ORDER BY c.relname;
