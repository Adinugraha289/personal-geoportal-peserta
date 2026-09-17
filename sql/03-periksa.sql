-- =====================================================================
-- Praktik 6 - periksa constraint yang benar-benar terpasang
--
-- Tempel seluruh isi berkas ini ke DBeaver, lalu Execute script (Alt+X).
-- Semua di sini hanya SELECT. Tidak mengubah apa pun.
--
-- Jangan mengandalkan tab Constraints di DBeaver untuk memeriksa ini.
-- Tab itu tidak menampilkan semua jenis constraint dengan cara yang sama,
-- dan pada PostgreSQL 18 definisi NOT NULL tersimpan di pg_constraint
-- sehingga penamaannya berbeda dari dugaan. Query di bawah membaca
-- katalog sistem langsung, jadi hasilnya pasti.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Semua constraint di tiga tabel, apa adanya
--
-- Harapan setelah sql/01-schema.sql dijalankan:
--   users            10 baris  (p, u, c, dan 7 NOT NULL)
--   katalog_data_2d   8 baris
--   katalog_data_3d   8 baris
--
-- Kode jenis: p primary key, u unique, f foreign key, c check, n not null
-- ---------------------------------------------------------------------
SELECT '1. Constraint yang terpasang' AS bagian;
SELECT c.relname AS tabel,
       con.conname AS nama_constraint,
       con.contype AS kode,
       CASE con.contype
         WHEN 'p' THEN 'PRIMARY KEY'
         WHEN 'u' THEN 'UNIQUE'
         WHEN 'f' THEN 'FOREIGN KEY'
         WHEN 'c' THEN 'CHECK'
         WHEN 'n' THEN 'NOT NULL'
         ELSE con.contype::text
       END AS arti
FROM pg_constraint con
JOIN pg_class c     ON c.oid = con.conrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('users', 'katalog_data_2d', 'katalog_data_3d')
ORDER BY c.relname, con.contype, con.conname;

-- ---------------------------------------------------------------------
-- 2. Ringkasan: berapa constraint per tabel
-- ---------------------------------------------------------------------
SELECT '2. Jumlah constraint per tabel' AS bagian;
SELECT c.relname AS tabel, count(*) AS jumlah,
       count(*) FILTER (WHERE con.contype = 'u') AS unique_,
       count(*) FILTER (WHERE con.contype = 'f') AS foreign_key,
       count(*) FILTER (WHERE con.contype = 'c') AS check_
FROM pg_constraint con
JOIN pg_class c     ON c.oid = con.conrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('users', 'katalog_data_2d', 'katalog_data_3d')
GROUP BY c.relname ORDER BY c.relname;

-- ---------------------------------------------------------------------
-- 3. Kolom mana yang belum NOT NULL
--
-- Harapan: hasilnya kosong. Kolom yang muncul di sini belum dikunci,
-- sehingga NULL bisa masuk.
-- ---------------------------------------------------------------------
SELECT '3. Kolom yang belum NOT NULL (harus kosong)' AS bagian;
SELECT table_name, column_name, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('users', 'katalog_data_2d', 'katalog_data_3d')
  AND is_nullable = 'YES'
ORDER BY table_name, column_name;

-- ---------------------------------------------------------------------
-- 4. Constraint yang seharusnya ada tetapi belum terpasang
--
-- Inilah yang paling berguna: daftar periksa yang langsung menyebut nama
-- constraint yang hilang, sehingga Anda tahu pernyataan mana yang perlu
-- dijalankan.
-- ---------------------------------------------------------------------
SELECT '4. Constraint yang hilang' AS bagian;
WITH seharusnya(tabel, nama) AS (
    VALUES
      ('users', 'users_pkey'),
      ('users', 'users_email_key'),
      ('users', 'users_role_valid'),
      ('katalog_data_2d', 'katalog_data_2d_pkey'),
      ('katalog_data_2d', 'katalog_data_2d_author_fkey'),
      ('katalog_data_2d', 'katalog_data_2d_akses_valid'),
      ('katalog_data_3d', 'katalog_data_3d_pkey'),
      ('katalog_data_3d', 'katalog_data_3d_author_fkey'),
      ('katalog_data_3d', 'katalog_data_3d_akses_valid')
)
SELECT s.tabel, s.nama AS nama_constraint_hilang
FROM seharusnya s
WHERE NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c     ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = s.tabel AND con.conname = s.nama
)
ORDER BY s.tabel, s.nama;

-- Bila bagian 4 berisi baris, jalankan sql/01-schema.sql. Berkas
-- itu aman dijalankan berulang dan hanya menambahkan yang belum ada.
