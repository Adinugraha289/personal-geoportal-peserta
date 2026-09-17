-- =====================================================================
-- Praktik 6 - diagnosa kegagalan constraint
--
-- Mencari sebab kegagalan constraint TANPA mengubah data apa pun.
-- Semua di sini hanya SELECT.
--
-- Berkas ini memakai SQL biasa, sehingga bisa dijalankan di DBeaver,
-- pgAdmin, TablePlus, atau klien apa pun. Tidak ada meta-command.
--
-- Cara pakai di DBeaver:
--   Buka SQL Editor pada koneksi database, tempel seluruh isi berkas ini,
--   lalu Execute script (Alt+X). Jangan Execute statement, karena hanya
--   akan menjalankan satu pernyataan.
--
-- Cara pakai di psql:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f 00_diagnosa.sql
--
-- Hasilnya sepuluh tabel kecil. Cocokkan dengan tabel keputusan di bawah.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Apakah tabel users sudah ada, dan bagaimana bentuknya?
--
-- Kalau tabel ini kosong, berarti tabel users belum pernah dibuat.
-- Kalau kolom email is_nullable = YES, kolom itu belum dikunci.
-- ---------------------------------------------------------------------
SELECT '1. Bentuk kolom tabel users' AS bagian;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = current_schema() AND table_name = 'users'
ORDER BY ordinal_position;

-- ---------------------------------------------------------------------
-- 2. Constraint apa saja yang sudah terpasang di users?
--
-- Kalau users_email_key SUDAH muncul di sini, kegagalannya bukan karena
-- data, melainkan karena constraint itu dipasang untuk kedua kali.
-- ---------------------------------------------------------------------
SELECT '2. Constraint pada tabel users' AS bagian;
SELECT con.conname AS nama_constraint,
       CASE con.contype
         WHEN 'p' THEN 'PRIMARY KEY'
         WHEN 'u' THEN 'UNIQUE'
         WHEN 'f' THEN 'FOREIGN KEY'
         WHEN 'c' THEN 'CHECK'
         WHEN 'n' THEN 'NOT NULL'
         ELSE con.contype::text
       END AS jenis
FROM pg_constraint con
JOIN pg_class c     ON c.oid = con.conrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = current_schema() AND c.relname = 'users'
ORDER BY con.contype, con.conname;

-- ---------------------------------------------------------------------
-- 3. Apakah ada email kembar?
--
-- Kalau ada baris di sini, UNIQUE (email) tidak bisa dipasang sebelum
-- kembarnya dibereskan. Inilah pesan "could not create unique index".
--
-- Perhatikan lower(email): UNIQUE memandang huruf besar-kecil sebagai
-- nilai berbeda, sehingga Budi@example.com dan budi@example.com lolos
-- walaupun bagi manusia keduanya sama.
-- ---------------------------------------------------------------------
SELECT '3. Email kembar (harus kosong)' AS bagian;
SELECT lower(email) AS email, count(*) AS jumlah, array_agg(user_id) AS user_id
FROM users
GROUP BY lower(email)
HAVING count(*) > 1
ORDER BY jumlah DESC;

-- ---------------------------------------------------------------------
-- 4. Apakah ada email NULL atau kosong?
--
-- UNIQUE memperbolehkan NULL berapa pun, jadi selama kolomnya boleh NULL,
-- email kosong bisa dimasukkan berkali-kali tanpa ditolak.
-- ---------------------------------------------------------------------
SELECT '4. Email NULL atau kosong (harus 0)' AS bagian;
SELECT count(*) FILTER (WHERE email IS NULL)        AS email_null,
       count(*) FILTER (WHERE btrim(email) = '')    AS email_kosong,
       count(*)                                     AS total_baris
FROM users;

-- ---------------------------------------------------------------------
-- 5. Apakah ada nilai role di luar daftar?
--
-- Inilah penyebab pesan "check constraint users_role_valid is violated".
-- Nilai seperti super_admn (salah ketik) akan muncul di sini.
-- ---------------------------------------------------------------------
SELECT '5. Role di luar daftar (harus kosong)' AS bagian;
SELECT role, count(*) AS jumlah
FROM users
WHERE role IS NULL OR role NOT IN ('viewer', 'editor', 'admin', 'super_admin')
GROUP BY role;

-- ---------------------------------------------------------------------
-- 6. Apakah tabel katalog sudah ada?
-- ---------------------------------------------------------------------
SELECT '6. Bentuk kolom tabel katalog' AS bagian;
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = current_schema()
  AND table_name IN ('katalog_data_2d', 'katalog_data_3d')
ORDER BY table_name, ordinal_position;

-- ---------------------------------------------------------------------
-- 7. Apakah ada author yang tidak punya baris induk?
--
-- Inilah sebab modul menyuruh menghapus baris hasil import. Foreign key
-- ke kolom tanpa baris induk selalu gagal.
-- ---------------------------------------------------------------------
SELECT '7. Author tanpa baris induk di 2D (harus kosong)' AS bagian;
SELECT k.data_2d_id, k.layer_name, k.author
FROM katalog_data_2d k
LEFT JOIN users u ON u.user_id = k.author
WHERE k.author IS NOT NULL AND u.user_id IS NULL;

SELECT '7b. Author tanpa baris induk di 3D (harus kosong)' AS bagian;
SELECT k.data_3d_id, k.nama, k.author
FROM katalog_data_3d k
LEFT JOIN users u ON u.user_id = k.author
WHERE k.author IS NOT NULL AND u.user_id IS NULL;

-- ---------------------------------------------------------------------
-- 8. Apakah ada layer_name kembar?
-- ---------------------------------------------------------------------
SELECT '8. layer_name kembar (harus kosong)' AS bagian;
SELECT layer_name, count(*) AS jumlah
FROM katalog_data_2d
GROUP BY layer_name
HAVING count(*) > 1;

-- ---------------------------------------------------------------------
-- 9. Berapa baris di tiap tabel?
-- ---------------------------------------------------------------------
SELECT '9. Jumlah baris' AS bagian;
SELECT 'users' AS tabel, count(*) AS baris FROM users
UNION ALL SELECT 'katalog_data_2d', count(*) FROM katalog_data_2d
UNION ALL SELECT 'katalog_data_3d', count(*) FROM katalog_data_3d;

-- ---------------------------------------------------------------------
-- 10. Apakah penulis yang dipakai CSV sudah ada?
--
-- Kedua UUID ini adalah nilai author pada berkas CSV. Bila salah satu
-- belum ada, import CSV akan gagal karena foreign key.
-- ---------------------------------------------------------------------
SELECT '10. Penulis yang dipakai CSV (harus 2 baris)' AS bagian;
SELECT user_id, nama, email, is_active FROM users
WHERE user_id IN ('ae5c7b2e-3537-4e94-ae1c-7596f1185f28',
                  'bc810d85-589d-4160-a9db-3c5516fa675a');

-- =====================================================================
-- TABEL KEPUTUSAN
--
-- Cocokkan hasil di atas dengan baris berikut, lalu jalankan berkas
-- perbaikan yang sesuai.
--
-- +---------------------------------------------+---------------------------+
-- | Gejala                                      | Berkas perbaikan          |
-- +---------------------------------------------+---------------------------+
-- | users belum ada (bagian 1 dan 9 kosong)      | 05_skema-siap-import.sql  |
-- | email kembar terisi (bagian 3)               | 03_perbaikan-email.sql    |
-- | email NULL atau kosong (bagian 4)            | 03_perbaikan-email.sql    |
-- | role di luar daftar terisi (bagian 5)        | 03_perbaikan-email.sql    |
-- | author tanpa induk terisi (bagian 7)         | 04_perbaikan-katalog-2d   |
-- | penulis CSV belum ada (bagian 10 kurang 2)   | 05_skema-siap-import.sql  |
-- +---------------------------------------------+---------------------------+
--
-- Bila bagian 3, 4, 5, 7, dan 8 semuanya kosong, dan bagian 10 berisi dua
-- baris, berarti tidak ada yang perlu diperbaiki. Kegagalan yang tersisa
-- hampir pasti karena constraint sudah terpasang, yang terlihat di
-- bagian 2.
-- =====================================================================
