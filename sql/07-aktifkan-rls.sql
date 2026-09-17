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

-- View juga perlu ditangani. Bawaannya, view berjalan dengan hak PEMILIKNYA,
-- bukan hak pemanggilnya. Karena pemilik tabel melewati RLS, view membuat
-- RLS pada tabel di bawahnya tidak berlaku.
--
-- Diuji: dengan RLS aktif pada tabel, peran anon tidak melihat satu baris pun
-- dari katalog_data_2d, tetapi MASIH melihat baris berakses 'private' beserta
-- email penulisnya melalui v_katalog_2d_lengkap.
--
-- ALTER VIEW aman dijalankan berkali-kali, dan dilewati bila view-nya tidak
-- ada, supaya berkas ini tetap dapat dijalankan pada database yang tidak
-- memakai view tersebut.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
          AND c.relname = 'v_katalog_2d_lengkap'
          AND c.relkind = 'v'
    ) THEN
        ALTER VIEW public.v_katalog_2d_lengkap SET (security_invoker = true);
    END IF;
END
$$;

COMMIT;

-- ---------------------------------------------------------------------
-- Periksa hasilnya. Ketiga baris harus bernilai true.
-- ---------------------------------------------------------------------
SELECT
    c.relname        AS objek,
    c.relkind        AS jenis,
    c.relrowsecurity AS rls,
    c.reloptions    AS opsi
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('users', 'katalog_data_2d', 'katalog_data_3d', 'v_katalog_2d_lengkap')
ORDER BY c.relname;

-- Harapan: tiga tabel bernilai rls = true, dan view memuat
-- security_invoker=true pada kolom opsi.
