-- =====================================================================
-- Praktik 6 - seed akun super admin
--
-- Menggantikan langkah manual pada modul Praktik 9: jalankan potongan JS
-- di REPL node, salin hash-nya, lalu tempel ke kolom password lewat SQL Editor.
-- Cara itu gampang salah ketik dan tidak bisa diulang orang lain.
--
-- Berkas ini memakai SQL biasa tanpa meta-command, sehingga bisa
-- ditempel apa adanya ke SQL Editor Supabase.
--
-- =====================================================================
-- LANGKAH 1. Buat hash kata sandi
-- =====================================================================
--
-- bcrypt hanya ada di Node, bukan di PostgreSQL, jadi hash dibuat lebih
-- dahulu. Jalankan dari terminal:
--
--   node scripts/hash-password.mjs
--
-- Skrip itu meminta kata sandi lewat prompt tersembunyi, sehingga kata
-- sandi aslinya tidak masuk riwayat terminal. Hasilnya satu baris yang
-- diawali $2b$12$.
--
-- =====================================================================
-- LANGKAH 2. Ganti dua nilai di Langkah 3, lalu jalankan berkas ini
-- =====================================================================
--
-- Di SQL Editor Supabase: tempel seluruh isi berkas ini, ganti kedua
-- nilai pada blok DO di bawah lebih dahulu, lalu klik Run.
--
-- Nilai yang salah ditolak penjagaan di dalam blok, sehingga kata sandi
-- polos tidak mungkin masuk ke kolom password.
--
-- =====================================================================
-- LANGKAH 3. Ganti, lalu jalankan
-- =====================================================================

DO $$
DECLARE
    email_admin text := '<ISI_EMAIL_DI_SINI>';
    hash_admin  text := '<ISI_HASH_DI_SINI>';
BEGIN
    -- Penjagaan diperiksa dari SISA PENANDA, bukan dengan membandingkan
    -- nilai terhadap penandanya sendiri. Cara itu penting: penggantian teks
    -- sederhana ikut mengubah string pembandingnya, sehingga perbandingan
    -- apa adanya justru menolak nilai yang sudah benar.
    IF email_admin LIKE '%<ISI_EMAIL%' THEN
        RAISE EXCEPTION 'Email belum diisi. Ganti nilai <ISI_EMAIL_DI_SINI> pada berkas ini.';
    END IF;

    IF hash_admin LIKE '%<ISI_HASH%' THEN
        RAISE EXCEPTION 'Hash belum diisi. Buat dulu dengan: node scripts/hash-password.mjs';
    END IF;

    -- Menolak nilai yang bukan hash bcrypt. Tanpa ini, salah paste kata
    -- sandi asli akan membuat akun tidak bisa login sekaligus menyimpan
    -- kata sandi polos di database.
    IF hash_admin !~ '^\$2[aby]\$[0-9]{2}\$' THEN
        RAISE EXCEPTION
            'Nilai hash bukan hash bcrypt. Yang benar diawali $2a$, $2b$, atau $2y$. Diterima: %',
            left(hash_admin, 12);
    END IF;

    IF email_admin !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' THEN
        RAISE EXCEPTION 'Email tidak sah: %', email_admin;
    END IF;

    INSERT INTO users (user_id, nama, email, password, role, is_active, created_at)
    VALUES (gen_random_uuid(), 'Super Admin', lower(btrim(email_admin)),
            hash_admin, 'super_admin', true, now())
    ON CONFLICT (email) DO UPDATE
    SET password  = EXCLUDED.password,
        role      = 'super_admin',
        is_active = true;

    RAISE NOTICE 'Akun super admin % siap dipakai.', lower(btrim(email_admin));
END $$;

-- Bila tabel users belum ada, jalankan sql/01-schema.sql lebih dahulu.

-- =====================================================================
-- VERIFIKASI
-- =====================================================================

SELECT 'Akun super admin' AS bagian;
SELECT user_id, nama, email, role, is_active, left(password, 7) AS awalan_hash
FROM users
WHERE role = 'super_admin';

-- Harapan: tepat satu baris, is_active true, awalan_hash diawali $2a$ atau $2b$.
