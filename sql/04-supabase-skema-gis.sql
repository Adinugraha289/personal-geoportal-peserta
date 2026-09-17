-- =====================================================================
-- Praktik 6 - membuat data spasial di schema gis pada Supabase
--
-- Modul Praktik 6 memuat satu perintah yang benar untuk PostgreSQL lokal,
-- tetapi tidak berlaku apa adanya di Supabase:
--
--   ALTER DATABASE namadatabase SET search_path TO gis, public;
--
-- Di PostgreSQL lokal hasil "CREATE EXTENSION postgis" berada di schema
-- tempat extension itu dipasang, biasanya gis atau public. Keduanya ada di
-- search_path, sehingga QGIS menemukan semuanya.
--
-- Di Supabase, PostGIS sering berakhir di schema extensions. Begitu
-- search_path dikunci ke "gis, public", schema extensions keluar dari
-- jangkauan, dan semua nama PostGIS yang dipanggil tanpa awalan schema
-- menjadi tidak ditemukan. QGIS memanggil AddGeometryColumn tanpa awalan
-- schema, jadi layer baru gagal dibuat dan digitasi tidak bisa disimpan.
--
--   ERROR: function addgeometrycolumn(unknown, unknown, unknown, integer, unknown, integer) does not exist
--   ERROR: type "geometry" does not exist
--   ERROR: function st_srid(geometry) does not exist
--
-- Berkas ini punya empat bagian:
--
--   Bagian 1  diagnosa          hanya SELECT, tidak mengubah apa pun
--   Bagian 2  perbaikan         menyertakan schema PostGIS ke search_path
--   Bagian 3  pembersihan       menghapus wrapper rusak dari modul Praktik 8
--   Bagian 4  uji fungsi        membuktikan jalur QGIS sudah jalan
--
-- Jalankan sebagai peran postgres, di SQL Editor Supabase atau DBeaver.
-- Tidak ada meta-command psql, jadi bisa ditempel apa adanya.
--
-- Catatan: setelah Bagian 2, koneksi QGIS dan DBeaver harus ditutup lalu
-- dibuka lagi. ALTER DATABASE hanya berlaku untuk sesi baru.
-- =====================================================================


-- =====================================================================
-- BAGIAN 1 - DIAGNOSA
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1.1 Di schema mana PostGIS benar-benar terpasang?
--
-- Ini akar masalahnya. Kalau hasilnya extensions sementara search_path
-- hanya "gis, public", lanjut ke Bagian 2.
-- ---------------------------------------------------------------------
SELECT '1.1 lokasi extension' AS bagian;
SELECT e.extname                       AS extension,
       n.nspname                       AS schema_postgis,
       e.extversion                    AS versi,
       pg_get_userbyid(e.extowner)     AS pemilik
FROM pg_extension e
JOIN pg_namespace n ON n.oid = e.extnamespace
WHERE e.extname LIKE 'postgis%'
ORDER BY e.extname;

-- ---------------------------------------------------------------------
-- 1.2 search_path yang berlaku sekarang
--
-- Tiga baris menunjukkan tiga sumber yang berbeda:
--   sesi         apa yang dipakai koneksi ini sekarang
--   database     nilai dari ALTER DATABASE, berlaku untuk semua sesi baru
--   peran        nilai dari ALTER ROLE, menimpa nilai database
-- ---------------------------------------------------------------------
SELECT '1.2 search_path' AS bagian;
SELECT 'sesi'     AS sumber, current_setting('search_path') AS nilai
UNION ALL
SELECT 'database', s.setconfig::text
FROM pg_db_role_setting s
JOIN pg_database d ON d.oid = s.setdatabase
WHERE d.datname = current_database() AND s.setrole = 0
UNION ALL
SELECT 'peran', s.setconfig::text
FROM pg_db_role_setting s
JOIN pg_roles r ON r.oid = s.setrole
WHERE r.rolname = current_user AND s.setdatabase = 0;

-- ---------------------------------------------------------------------
-- 1.3 Apakah nama PostGIS bisa dipanggil tanpa awalan schema?
--
-- Inilah yang dilakukan QGIS. Kalau kedua tipe bernilai false, atau daftar
-- fungsinya kosong, perbaikan di Bagian 2 memang diperlukan.
--
-- Cara membaca: daftar schema diurutkan sesuai prioritas pencarian.
-- Fungsi addgeometrycolumn yang dipakai QGIS adalah yang paling atas.
-- ---------------------------------------------------------------------
SELECT '1.3 nama PostGIS di jalur pencarian' AS bagian;
SELECT to_regtype('geometry')  IS NOT NULL AS tipe_geometry_ketemu,
       to_regtype('geography') IS NOT NULL AS tipe_geography_ketemu;

SELECT n.nspname || '.' || p.oid::regprocedure::text AS fungsi_addgeometrycolumn,
       array_position(current_schemas(true), n.nspname) AS prioritas
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE p.proname = 'addgeometrycolumn'
  AND n.nspname = ANY (current_schemas(true))
ORDER BY prioritas NULLS LAST;

-- ---------------------------------------------------------------------
-- 1.4 Apakah yang ada di schema gis memang tabel spasial?
--
-- format_type dipakai supaya kolom geometri tetap terbaca walaupun tipe
-- geometry sedang tidak ada di search_path.
--
-- Tabel tanpa primary key akan terbuka sebagai layer baca-saja di QGIS,
-- dan itu sebab kegagalan menyimpan yang berbeda dari masalah search_path.
-- ---------------------------------------------------------------------
SELECT '1.4 isi schema gis' AS bagian;
SELECT c.relname                                       AS tabel,
       COALESCE(a.attname, '-')                        AS kolom_geometri,
       COALESCE(format_type(a.atttypid, a.atttypmod), '-') AS tipe,
       EXISTS (SELECT 1 FROM pg_index i
               WHERE i.indrelid = c.oid AND i.indisprimary) AS ada_primary_key,
       pg_get_userbyid(c.relowner)                     AS pemilik,
       c.relrowsecurity                                AS rls_aktif
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN pg_attribute a
       ON a.attrelid = c.oid
      AND a.attnum > 0
      AND NOT a.attisdropped
      AND a.atttypid IN (SELECT t.oid FROM pg_type t
                         WHERE t.typname IN ('geometry', 'geography'))
WHERE n.nspname = 'gis'
  AND c.relkind = 'r'
ORDER BY c.relname;

-- ---------------------------------------------------------------------
-- 1.5 Apakah peran koneksi berhak membuat tabel di schema gis?
-- ---------------------------------------------------------------------
SELECT '1.5 hak akses schema gis' AS bagian;
SELECT current_user                                     AS peran_koneksi,
       has_schema_privilege('gis', 'USAGE')             AS boleh_pakai,
       has_schema_privilege('gis', 'CREATE')            AS boleh_buat_tabel,
       pg_get_userbyid(n.nspowner)                      AS pemilik_schema
FROM pg_namespace n
WHERE n.nspname = 'gis';


-- =====================================================================
-- BAGIAN 2 - PERBAIKAN
--
-- Menyusun ulang search_path: schema data tetap di depan, lalu public,
-- lalu schema tempat PostGIS benar-benar berada. Nilainya dibaca dari
-- katalog, jadi tidak perlu disesuaikan manual.
--
-- Aman dijalankan berulang. Tidak menghapus dan tidak mengubah data.
-- =====================================================================

DO $$
DECLARE
    skema_data    text := 'gis';     -- schema tempat tabel spasial disimpan
    skema_postgis text;
    jalur         text;
BEGIN
    SELECT n.nspname INTO skema_postgis
    FROM pg_extension e
    JOIN pg_namespace n ON n.oid = e.extnamespace
    WHERE e.extname = 'postgis';

    IF skema_postgis IS NULL THEN
        RAISE EXCEPTION 'extension postgis belum aktif di database ini. '
                        'Aktifkan lebih dahulu lewat Database > Extensions.';
    END IF;

    SELECT string_agg(s, ', ' ORDER BY urutan) INTO jalur
    FROM (
        SELECT skema_data AS s, 1 AS urutan
        UNION ALL SELECT 'public', 2
        UNION ALL SELECT skema_postgis, 3
         WHERE skema_postgis NOT IN (skema_data, 'public')
    ) t;

    EXECUTE format('ALTER DATABASE %I SET search_path TO %s', current_database(), jalur);

    -- ALTER DATABASE hanya berlaku untuk sesi baru. Baris berikut menyetel
    -- jalur yang sama untuk sesi ini juga, supaya uji di Bagian 4 langsung
    -- mewakili keadaan setelah koneksi dibuka ulang.
    PERFORM set_config('search_path', jalur, false);

    RAISE NOTICE 'search_path database % diset ke: %', current_database(), jalur;
    RAISE NOTICE 'Tutup lalu buka lagi koneksi QGIS dan DBeaver supaya berlaku.';
END $$;

-- Kalau perintah di atas ditolak dengan "must be owner of database",
-- pakai bentuk per peran berikut sebagai gantinya, lalu jalankan ulang
-- Bagian 1.2 untuk memastikan nilainya masuk:
--
--   ALTER ROLE postgres IN DATABASE postgres SET search_path TO gis, public, extensions;


-- =====================================================================
-- BAGIAN 3 - PEMBERSIHAN WRAPPER DARI MODUL PRAKTIK 8
--
-- Modul Praktik 8 meminta membuat fungsi public.addgeometrycolumn dan
-- gis.addgeometrycolumn sebagai pengganti. Baris cadangan di dalamnya
-- memanggil public.AddGeometryColumn dengan enam argumen, sementara fungsi
-- itu sendiri dideklarasikan dengan tujuh argumen tanpa nilai bawaan.
-- Panggilan enam argumen karena itu tidak pernah cocok, di mana pun PostGIS
-- dipasang, dan yang muncul di QGIS adalah pesan menyesatkan:
--
--   ERROR: function public.addgeometrycolumn(character varying, character
--          varying, character varying, integer, character varying, integer)
--          does not exist
--
-- Padahal fungsi itu ada, hanya jumlah argumennya tidak pernah cocok.
--
-- Setelah Bagian 2, fungsi PostGIS asli sudah bisa dipanggil langsung,
-- sehingga wrapper ini tidak diperlukan lagi. Menghapusnya sekaligus
-- menutup temuan P8-1: wrapper itu satu-satunya objek yang diberikan
-- GRANT EXECUTE ke PUBLIC, anon, dan authenticated.
--
-- Penjagaan pg_depend memastikan fungsi milik extension PostGIS tidak
-- pernah ikut terhapus. Yang dihapus hanya fungsi buatan sendiri.
-- =====================================================================

DO $$
DECLARE
    r      record;
    jumlah int := 0;
BEGIN
    FOR r IN
        SELECT format('%s.%s(%s)',
                      n.nspname,
                      p.proname,
                      pg_get_function_identity_arguments(p.oid)) AS tanda_tangan
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE p.proname = 'addgeometrycolumn'
          AND n.nspname IN ('public', 'gis')
          -- Fungsi PostGIS selalu membawa argumen use_typmod. Fungsi dari
          -- modul Praktik 8 tidak. Syarat ini mempersempit sasaran ke
          -- fungsi yang memang dibuat mengikuti modul itu.
          AND pg_get_function_identity_arguments(p.oid) NOT LIKE '%use_typmod%'
          AND NOT EXISTS (
                SELECT 1 FROM pg_depend d
                WHERE d.objid = p.oid
                  AND d.refclassid = 'pg_extension'::regclass
                  AND d.deptype = 'e')
    LOOP
        EXECUTE format('DROP FUNCTION %s', r.tanda_tangan);
        RAISE NOTICE 'wrapper buatan sendiri dihapus: %', r.tanda_tangan;
        jumlah := jumlah + 1;
    END LOOP;

    IF jumlah = 0 THEN
        RAISE NOTICE 'tidak ada wrapper buatan sendiri yang perlu dihapus';
    END IF;
END $$;


-- =====================================================================
-- BAGIAN 4 - UJI FUNGSI
--
-- Meniru persis panggilan yang dilakukan QGIS saat membuat kolom geometri
-- di schema gis. Tabel uji dibuat lalu dihapus lagi dalam blok yang sama,
-- sehingga tidak meninggalkan sisa. Kalau gagal, pesan aslinya dicetak.
-- =====================================================================

DO $$
DECLARE
    hasil text;
BEGIN
    BEGIN
        DROP TABLE IF EXISTS gis.uji_prasyarat_qgis;
        CREATE TABLE gis.uji_prasyarat_qgis (id serial PRIMARY KEY);
        SELECT AddGeometryColumn('gis', 'uji_prasyarat_qgis', 'geom', 4326, 'POINT', 2)
          INTO hasil;
        RAISE NOTICE 'BERHASIL: %', hasil;
        RAISE NOTICE 'Jalur QGIS sudah benar. Ulangi langkah Praktik 6 di QGIS.';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'GAGAL: % (SQLSTATE %)', SQLERRM, SQLSTATE;
        RAISE NOTICE 'Kirimkan baris GAGAL ini supaya sebabnya bisa dipastikan.';
    END;

    DROP TABLE IF EXISTS gis.uji_prasyarat_qgis;
END $$;

-- Pemeriksaan ulang. Dua kolom harus bernilai true, dan daftar fungsi harus
-- memuat addgeometrycolumn dari schema tempat PostGIS dipasang.
SELECT to_regtype('geometry')  IS NOT NULL AS tipe_geometry_ketemu,
       to_regtype('geography') IS NOT NULL AS tipe_geography_ketemu;

SELECT current_setting('search_path') AS search_path_sekarang;


-- =====================================================================
-- TABEL KEPUTUSAN
--
-- Cocokkan pesan galat di QGIS dengan baris yang sesuai.
--
-- | Pesan galat                                                  | Sebab                        | Tindakan |
-- |--------------------------------------------------------------|------------------------------|----------|
-- | function addgeometrycolumn(...) does not exist               | PostGIS di luar search_path  | Bagian 2 |
-- | type "geometry" does not exist                               | sama                         | Bagian 2 |
-- | function st_srid / st_makepoint / st_astext ... does not exist| sama                        | Bagian 2 |
-- | function public.addgeometrycolumn(character varying, ...)    | wrapper modul Praktik 8      | Bagian 2, lalu Bagian 3 |
-- |   does not exist                                               | dipanggil dengan 6 argumen   |          |
-- | permission denied for schema gis                             | peran koneksi bukan pemilik  | GRANT USAGE, CREATE ON SCHEMA gis TO <peran>; |
-- | new row violates row-level security policy                   | RLS aktif pada tabel spasial | ALTER TABLE gis.<tabel> DISABLE ROW LEVEL SECURITY; |
-- | prepared statement "..." already exists, atau koneksi        | koneksi lewat pooler mode    | Ganti port 6543 menjadi 5432 |
-- |   terputus saat menyimpan                                     | transaction                  |          |
-- | Toggle editing mati, layer terbaca baca-saja                 | tabel tanpa primary key      | ALTER TABLE gis.<tabel> ADD PRIMARY KEY (id); |
--
-- Dua catatan tentang Supabase yang sering tertukar:
--
-- 1. Port 6543 adalah pooler mode transaction. Alat seperti QGIS dan
--    DBeaver memakai prepared statement dan pengaturan per sesi, dan
--    keduanya tidak bertahan pada mode itu. Halaman Connect Supabase
--    menyediakan port 5432 (session pooler) yang aman untuk alat tersebut.
--    DATABASE_URL di berkas .env aplikasi tetap boleh memakai 6543.
--
-- 2. PostGIS tidak bisa dipindah schema setelah terpasang (sejak PostGIS
--    2.3). Memindahkannya menuntut DROP EXTENSION postgis CASCADE lalu
--    CREATE EXTENSION ulang. Karena itu Bagian 2 menyesuaikan search_path,
--    bukan memindahkan extensionnya.
-- =====================================================================
