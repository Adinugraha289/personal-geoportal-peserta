-- =====================================================================
-- Skema database non spasial
-- Membuat tiga tabel: users, katalog_data_2d, dan katalog_data_3d.
--
-- Cara pakai: buka SQL Editor di dashboard Supabase, salin SELURUH isi
-- berkas ini, tempel, lalu klik Run. Penjelasan SQL Editor ada di
-- sql/README.md.
--
-- Berkas ini idempoten: CREATE TABLE IF NOT EXISTS tidak menghapus data
-- yang sudah ada, jadi aman dijalankan lebih dari sekali.
-- Untuk mulai dari nol, hapus dulu ketiga tabelnya. Perintahnya ada pada
-- bagian "Mengosongkan Tabel" di sql/README.md.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- users
-- Sumber kebenaran untuk autentikasi. Kolom mengikuti pemakaian di
-- Dipakai oleh lib/auth dan konfigurasi NextAuth.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    user_id     uuid         PRIMARY KEY,
    nama        varchar(100) NOT NULL,
    email       varchar(150) NOT NULL,
    password    varchar(255) NOT NULL,
    role        varchar(20)  NOT NULL DEFAULT 'viewer',
    is_active   boolean      NOT NULL DEFAULT false,
    created_at  timestamptz  NOT NULL DEFAULT now(),

    -- Baseline nilai. Validasi hanya ada di kode aplikasi,
    -- sehingga batasan berikut ditambahkan di database supaya data tidak
    -- bisa masuk lewat jalur lain, misalnya import CSV atau klien database.
    CONSTRAINT users_email_key UNIQUE (email),
    CONSTRAINT users_role_valid
        CHECK (role IN ('viewer', 'admin', 'super_admin'))
);

COMMENT ON COLUMN users.password IS
    'Hash bcrypt ($2a$/$2b$), BUKAN password asli. Seed manual lewat 02-seed-super-admin.sql.';

-- ---------------------------------------------------------------------
-- katalog_data_2d
-- Kolom mengikuti berkas contoh katalog_data_2d.csv.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS katalog_data_2d (
    data_2d_id  uuid         PRIMARY KEY,
    layer_name  varchar(255) NOT NULL,
    akses       varchar(20)  NOT NULL,
    is_editable boolean      NOT NULL,
    wms_url     text,
    wfs_url     text,
    author      uuid,

    CONSTRAINT katalog_data_2d_layer_name_key UNIQUE (layer_name),
    CONSTRAINT katalog_data_2d_akses_valid
        CHECK (akses IN ('public', 'private')),
    CONSTRAINT katalog_data_2d_author_fkey
        FOREIGN KEY (author) REFERENCES users (user_id)
        ON DELETE RESTRICT
);

-- ---------------------------------------------------------------------
-- katalog_data_3d
-- Kolom mengikuti berkas contoh katalog_data_3d.csv.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS katalog_data_3d (
    data_3d_id uuid         PRIMARY KEY,
    author     uuid,
    nama       varchar(150) NOT NULL,
    akses      varchar(20)  NOT NULL,
    url        text,
    latitude   double precision,
    longitude  double precision,
    heading    double precision,
    pitch      double precision,
    roll       double precision,
    scale      double precision,
    -- Aplikasi tidak pernah mengirim kolom ini saat menyimpan data 3D
    -- (lihat src/app/api/katalog-data-3d/create/route.js). Tanpa nilai
    -- bawaan, setiap penyimpanan gagal dengan
    -- "null value in column tipe_file violates not-null constraint".
    tipe_file  varchar(10)  NOT NULL DEFAULT 'glb',

    CONSTRAINT katalog_data_3d_akses_valid
        CHECK (akses IN ('public', 'private')),
    CONSTRAINT katalog_data_3d_tipe_file_valid
        CHECK (tipe_file IN ('glb', 'ply', 'gltf')),
    CONSTRAINT katalog_data_3d_lat_range
        CHECK (latitude  IS NULL OR latitude  BETWEEN -90  AND 90),
    CONSTRAINT katalog_data_3d_lon_range
        CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180),
    CONSTRAINT katalog_data_3d_author_fkey
        FOREIGN KEY (author) REFERENCES users (user_id)
        ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS katalog_data_2d_author_idx ON katalog_data_2d (author);
CREATE INDEX IF NOT EXISTS katalog_data_2d_akses_idx  ON katalog_data_2d (akses);
CREATE INDEX IF NOT EXISTS katalog_data_3d_author_idx ON katalog_data_3d (author);

-- View baca-saja: join yang sama dengan yang dilakukan kode API, supaya
-- query ad-hoc tidak perlu menuliskan join berulang.
-- security_invoker = true WAJIB ada di sini.
--
-- Bawaannya, view berjalan dengan hak PEMILIKNYA, bukan hak pemanggilnya.
-- Karena pemilik tabel melewati Row Level Security, view tanpa opsi ini
-- membuat RLS pada katalog_data_2d dan users tidak berlaku ketika view itu
-- yang dibaca. Diuji: dengan RLS aktif, peran anon tidak melihat satu baris
-- pun dari tabel katalog_data_2d, tetapi MASIH melihat baris berakses
-- 'private' beserta email penulisnya melalui view ini.
--
-- Dengan security_invoker = true, view berjalan dengan hak pemanggilnya,
-- sehingga RLS ikut berlaku.
CREATE OR REPLACE VIEW v_katalog_2d_lengkap
WITH (security_invoker = true) AS
SELECT k.data_2d_id,
       k.layer_name,
       k.akses,
       k.is_editable,
       k.wms_url,
       k.wfs_url,
       u.user_id AS author_id,
       u.nama    AS author_nama,
       u.email   AS author_email
FROM katalog_data_2d k
LEFT JOIN users u ON u.user_id = k.author;

COMMIT;

-- ---------------------------------------------------------------------
-- Verifikasi (jalankan terpisah setelah COMMIT)
-- ---------------------------------------------------------------------
-- Harapan: tiga tabel, masing-masing punya primary key, dan
-- katalog_data_2d punya satu foreign key (contype 'f') ke users.
--
--   SELECT c.relname AS tabel, con.contype AS jenis, con.conname AS nama
--   FROM pg_constraint con
--   JOIN pg_class c     ON c.oid = con.conrelid
--   JOIN pg_namespace n ON n.oid = c.relnamespace
--   WHERE n.nspname = current_schema()
--     AND c.relname IN ('users', 'katalog_data_2d', 'katalog_data_3d')
--   ORDER BY c.relname, con.contype;
--
--   -- Harus kosong. Kalau ada isinya, CSV belum selesai dibersihkan.
--   SELECT k.data_2d_id, k.author
--   FROM katalog_data_2d k
--   LEFT JOIN users u ON u.user_id = k.author
--   WHERE k.author IS NOT NULL AND u.user_id IS NULL;

-- =====================================================================
-- Keamanan: aktifkan Row Level Security pada ketiga tabel
--
-- Tanpa ini, tabel di schema public dapat dibaca dan diubah lewat REST API
-- Supabase memakai kunci anon, tanpa perlu login ke aplikasi. Kunci anon
-- memang dirancang untuk dipakai di sisi peramban, jadi nilainya tidak
-- dianggap rahasia. Yang mencegah penyalahgunaan adalah RLS, bukan
-- kerahasiaan kunci itu.
--
-- Diuji pada project Supabase sungguhan:
--
--   SEBELUM RLS   peran anon dapat membaca kolom password, dan memiliki
--                 izin SELECT, INSERT, UPDATE, DELETE, dan TRUNCATE
--                 pada tabel users.
--
--   SESUDAH RLS   peran anon dan authenticated tidak melihat satu baris pun.
--                 Aplikasi tetap berjalan normal, karena koneksi Prisma
--                 memakai peran postgres yang merupakan PEMILIK tabel,
--                 dan pemilik tabel melewati RLS secara bawaan.
--
-- RLS tanpa policy berarti menutup akses untuk semua peran selain pemilik.
-- Itu memang yang diinginkan di sini: seluruh akses data dilakukan lewat
-- API aplikasi sendiri, yang sudah memeriksa token dan peran pengguna.
-- =====================================================================
BEGIN;

ALTER TABLE users           ENABLE ROW LEVEL SECURITY;
ALTER TABLE katalog_data_2d ENABLE ROW LEVEL SECURITY;
ALTER TABLE katalog_data_3d ENABLE ROW LEVEL SECURITY;

COMMIT;

-- ---------------------------------------------------------------------
-- Periksa hasilnya. Harus menampilkan rls = true untuk ketiga tabel.
--
--   SELECT relname AS tabel, relrowsecurity AS rls
--   FROM pg_class c
--   JOIN pg_namespace n ON n.oid = c.relnamespace
--   WHERE n.nspname = 'public'
--     AND c.relkind = 'r'
--     AND c.relname IN ('users', 'katalog_data_2d', 'katalog_data_3d')
--   ORDER BY relname;
-- ---------------------------------------------------------------------
