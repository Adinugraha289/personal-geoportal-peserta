# Skema Database

Folder ini memuat skrip SQL untuk membuat tabel yang dipakai aplikasi. Semuanya dijalankan lewat **SQL Editor Supabase**, tanpa memasang apa pun di komputer Anda.

## Apa Itu SQL Editor

SQL Editor adalah halaman di dalam dashboard Supabase untuk menjalankan perintah SQL ke database Anda. Anggap saja seperti terminal khusus database, tetapi berbentuk halaman web.

Cara membukanya:

1. Buka project Anda di [supabase.com/dashboard](https://supabase.com/dashboard).
2. Pada menu kiri, klik **SQL Editor**.
3. Halaman ini punya kotak besar untuk menulis atau menempel perintah, tombol **Run** di kanan bawah, dan daftar riwayat perintah di sisi kiri.

Dua tombol yang perlu dibedakan:

| Tombol | Gunanya |
|---|---|
| **Run** | Menjalankan seluruh isi kotak sekaligus. Ini yang dipakai di panduan ini. |
| **Run selected** | Menjalankan hanya teks yang Anda blok. Berguna untuk mengulang satu perintah saja. |

Hasil perintah muncul di panel bawah. Untuk perintah `CREATE TABLE` hasilnya hanya keterangan bahwa perintah berhasil. Untuk perintah `SELECT`, hasilnya berupa tabel.

Cara memakai skrip di folder ini: buka berkasnya, salin **seluruh** isinya, tempel ke SQL Editor, lalu klik **Run**. Jangan salin sebagian, karena beberapa berkas memakai `BEGIN` dan `COMMIT` yang harus berpasangan.

## Urutan Pengerjaan

Jalankan berurutan. Setiap baris di bawah adalah satu kali tempel dan satu kali Run.

| # | Berkas | Kapan | Mengubah data? |
|---|---|---|---|
| 1 | `01-schema.sql` | Setelah project Supabase dibuat | Tidak, hanya membuat tabel |
| 2 | `02-seed-super-admin.sql` | Setelah langkah 1 | Ya, menambah satu akun super admin |
| 3 | `03-periksa.sql` | Setelah langkah 2 | Tidak, hanya membaca |
| 4 | `05-diagnosa-constraint.sql` | Bila ada kegagalan constraint | Tidak, hanya membaca |
| 5 | `04-postgis-supabase.sql` | Hanya untuk data spasial, baca catatannya | Ya, mengubah `search_path` database |
| 6 | `06-migrasi-peran-viewer.sql` | Hanya bila database dibuat memakai versi `01-schema.sql` yang lama | Ya, memindahkan akun berperan `editor` |

Berkas nomor 6 hanya diperlukan bila database Anda sudah terlanjur dibuat sebelum peran `editor` dihapus. Sebabnya, `01-schema.sql` memakai `CREATE TABLE IF NOT EXISTS`, sehingga menjalankannya kembali **tidak** mengubah tabel yang sudah ada.

Akibat bila berkas itu tidak dijalankan pada database lama: akun yang berperan `editor` masih dapat login, tetapi ditolak di seluruh endpoint katalog dengan `403`, karena `lib/auth/roles.js` tidak lagi mengenal peran itu.

Langkah 1 sampai 3 sudah cukup untuk membuat portal berjalan dengan login dan Kelola Akun.

## Tiga Tabel yang Dibuat

Skema ini mengikuti pemakaian di dalam kode aplikasi, bukan sebaliknya. Kolomnya sudah dicocokkan dengan berkas berikut:

| Tabel | Dipakai oleh |
|---|---|
| `users` | `lib/auth/verifyCredentials.js`, `lib/auth/jwt.js`, `src/app/api/users/*` |
| `katalog_data_2d` | `src/app/api/katalog-data-2d/*` |
| `katalog_data_3d` | `src/app/api/katalog-data-3d/*` |

### users

Kolom yang wajib terisi saat mendaftar: `user_id`, `nama`, `email`, `password`, `role`, `is_active`.

Dua kolom yang menentukan perilaku login:

- `password` menyimpan hash bcrypt, bukan kata sandi asli.
- `is_active` bernilai `false` untuk setiap akun baru. Selama `false`, login ditolak dengan pesan yang meminta aktivasi.

Nilai `role` dibatasi pada `viewer`, `admin`, dan `super_admin`. Halaman pendaftaran selalu menghasilkan `viewer`. Hanya `02-seed-super-admin.sql` yang bisa membuat `super_admin`, dan itu memang disengaja supaya tidak ada yang bisa menaikkan perannya sendiri.

### katalog_data_2d dan katalog_data_3d

Keduanya menyimpan metadata katalog, bukan berkas datanya. Kolom `author` menunjuk ke `users.user_id`.

`katalog_data_3d.tipe_file` punya nilai bawaan `'glb'`. Kolom itu tidak pernah dikirim aplikasi saat menyimpan data 3D, sehingga tanpa nilai bawaan setiap penyimpanan akan gagal dengan:

```
null value in column "tipe_file" violates not-null constraint
```

## Membuat Akun Super Admin

Tiga langkah. Langkah 1 dijalankan di terminal, langkah 2 dan 3 di SQL Editor.

**Langkah 1. Buat hash kata sandi.** Di folder proyek, jalankan:

```bash
node scripts/hash-password.mjs
```

Skrip itu meminta kata sandi lewat prompt tersembunyi, jadi kata sandinya tidak muncul di layar dan tidak masuk riwayat terminal. Hasilnya satu baris berawalan `$2b$12$`. Salin baris itu.

**Langkah 2. Isi penandanya.** Buka `02-seed-super-admin.sql`, lalu ganti dua penanda di bagian `LANGKAH 3`:

```sql
email_admin text := '<ISI_EMAIL_DI_SINI>';   -- ganti dengan email Anda
hash_admin  text := '<ISI_HASH_DI_SINI>';    -- tempel hash dari langkah 1
```

**Langkah 3. Jalankan.** Salin seluruh isi berkas yang sudah diubah ke SQL Editor, lalu Run. Hasilnya:

```
NOTICE: Akun super admin nama@email.com siap dipakai.
```

Skrip itu punya penjagaan. Kalau penandanya belum diganti, perintahnya berhenti dengan pesan yang menyebut penanda mana yang belum diisi, bukan membuat akun dengan email kosong.

Setelah itu masuk ke portal memakai email dan kata sandi tersebut.

## Menguji Hasilnya

Setelah skema terpasang dan `.env` terisi, jalankan dari folder proyek:

```bash
node scripts/uji-database.mjs
```

Skrip itu memeriksa dua belas hal sekaligus: ketiga tabel dapat dibaca, akun belum aktif ditolak, kata sandi salah ditolak, login setelah diaktifkan berhasil, katalog 2D dan 3D dapat disimpan, serta constraint role dan unique email bekerja. Data ujinya dihapus kembali di akhir.

Skrip ini hanya butuh Node.js, sama seperti `hash-password.mjs`. Tidak perlu memasang klien database.

## Data Spasial PostGIS

Bagian ini berlaku hanya kalau Anda akan mengunggah layer 2D ke katalog, yaitu fitur yang membuat tabel spasial di PostGIS lalu menerbitkannya sebagai layer di GeoServer.

Ada dua hal berbeda yang sering tertukar:

| | Schema | Keterangan |
|---|---|---|
| **PostGIS dipasang di** | `public` | Wajib. GeoServer tidak dapat membaca PostGIS dari schema lain |
| **Tabel spasial dibuat di** | `gis` | Bebas, sesuai kesepakatan pelatihan |

### PostGIS dipasang di schema public

Saat mengaktifkan PostGIS, pilih schema `public`, jangan pilih **Create New Schema**.

Alasannya, GeoServer memeriksa versi PostGIS lewat fungsi `postgis_lib_version()` setiap kali membuka koneksi ke datastore. Fungsi itu dicari memakai `search_path` koneksi GeoServer, dan `search_path` itu hanya memuat schema `public` beserta schema yang diisi pada kolom **schema** datastore. Bila PostGIS dipasang di schema `gis` sementara datastore menunjuk schema `gis`, fungsinya tetap tidak ditemukan dan GeoServer gagal terhubung:

```
Unable to obtain connection: ERROR: function postgis_lib_version() does not exist
```

Di aplikasi, gejala ini muncul sebagai unggahan layer yang selalu gagal dengan pesan kosong, sehingga penyebab sebenarnya hanya terlihat di log GeoServer.

### Tabel spasial tetap di schema gis

Pemisahan data di schema `gis` tetap dipakai, sesuai kesepakatan pelatihan. Isi datastore GeoServer seperti ini:

| Kolom pada form datastore | Nilai |
|---|---|
| host | `aws-0-<region>.pooler.supabase.com` |
| port | `5432` |
| database | `postgres` |
| user | `postgres.<ref>` |
| password | kata sandi database |
| **schema** | **`gis`** |

Pada `.env` aplikasi, isi `POSTGIS_SCHEMA=gis` supaya tabel dibuat di schema yang sama dengan datastore.

Dengan susunan ini, tabel berada di `gis` sementara PostGIS berada di `public`, dan keduanya terjangkau.

### Urutan pengerjaan yang benar

Urutannya berpengaruh, karena GeoServer menyimpan kegagalan koneksi pertamanya.

1. Aktifkan PostGIS di schema `public`.
2. Jalankan `CREATE SCHEMA IF NOT EXISTS gis;` di SQL Editor.
3. Buat datastore di GeoServer dengan schema `gis`.
4. Baru unggah layer dari aplikasi.

Bila datastore dibuat sebelum PostGIS aktif, GeoServer menyimpan kegagalan itu. Hapus lalu buat ulang datastore-nya setelah PostGIS aktif.

### Bila Anda pernah memakai PostgreSQL lokal

Modul Praktik 6 untuk PostgreSQL lokal memuat dua perintah berikut:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
ALTER DATABASE geoportal SET search_path TO gis, public;
SHOW search_path;
```

Di PostgreSQL lokal, dua perintah itu membuat PostGIS dan tabel spasial sama-sama terjangkau, meskipun PostGIS dipasang di schema `gis`. Perintah `ALTER DATABASE` di situ bekerja, dan hasil `SHOW search_path` menampilkan `gis, public`.

**Di Supabase, `ALTER DATABASE` itu tidak berpengaruh.** Supabase menetapkan `search_path` pada tingkat koneksi lewat connection pooler, dan setelan tingkat koneksi selalu menang atas setelan tingkat database. Anda dapat memeriksanya sendiri: setelah menjalankan `ALTER DATABASE`, koneksi baru tetap melaporkan `"$user", public, extensions`.

Akibatnya, PostGIS yang dipasang di schema `gis` tidak terjangkau di Supabase, dan dua hal ini gagal:

| Yang gagal | Pesan galat |
|---|---|
| Aplikasi membuat tabel spasial | `type "geometry" does not exist` |
| GeoServer membuka datastore | `function postgis_lib_version() does not exist` |

Karena itu di Supabase PostGIS dipasang di schema `public`, bukan di `gis`. Tabel spasialnya tetap di `gis`, sesuai susunan pada bagian di atas.

### Ringkasan perbedaan

| | PostgreSQL lokal | Supabase |
|---|---|---|
| PostGIS dipasang di | `gis` | `public` |
| Tabel spasial di | `gis` | `gis` |
| Cara membuatnya terjangkau | `ALTER DATABASE ... SET search_path TO gis, public` | PostGIS di schema `public`, yang sudah ada di `search_path` bawaan |
| Datastore GeoServer | schema `gis` | schema `gis` |

Kolom `schema` pada datastore GeoServer tetap `gis` di kedua lingkungan, dan `POSTGIS_SCHEMA` pada `.env` juga tetap `gis`.

## Mengosongkan Tabel

Kalau perlu memulai dari nol, jalankan perintah ini di SQL Editor. Seluruh isi ketiga tabel akan hilang.

```sql
DROP VIEW  IF EXISTS v_katalog_2d_lengkap;
DROP TABLE IF EXISTS katalog_data_2d CASCADE;
DROP TABLE IF EXISTS katalog_data_3d CASCADE;
DROP TABLE IF EXISTS users           CASCADE;
```

Setelah itu jalankan `01-schema.sql` lagi.

## Bila Login Gagal

Periksa berurutan:

1. **`DATABASE_URL` salah.** Pesan galatnya menyebut `Can't reach database server`. Periksa bagian "Koneksi ke Supabase" pada README utama. Bila memakai port 6543, pastikan ada `?pgbouncer=true` di akhir alamatnya.
2. **Tabel belum ada.** Jalankan `03-periksa.sql`. Hasilnya harus menampilkan tiga tabel.
3. **Akun belum aktif.** Jalankan di SQL Editor:
   ```sql
   SELECT email, role, is_active FROM users;
   UPDATE users SET is_active = true WHERE email = 'email-anda';
   ```
4. **Kata sandi tidak cocok.** Periksa hash yang tersimpan:
   ```bash
   node scripts/hash-password.mjs --cek '<hash-dari-kolom-password>'
   ```
5. **Pesan menyebut tabel tidak ditemukan.** Prisma membaca schema `public`. Pastikan ketiga tabel dibuat di sana, bukan di schema lain.
6. **Masih gagal.** Jalankan `05-diagnosa-constraint.sql`, yang memeriksa sepuluh hal sekaligus dan diakhiri tabel keputusan: gejala mana menunjuk ke perbaikan mana.

## Menjalankan Lewat Terminal

Bagian ini opsional. Hanya perlu kalau Anda sudah memasang `psql`, dan tidak diperlukan untuk mengikuti pelatihan.

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f sql/01-schema.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f sql/03-periksa.sql
```

Berkas 01 dan 03 bersifat idempoten, memakai `CREATE TABLE IF NOT EXISTS`. Menjalankannya dua kali tidak menghapus data yang sudah ada.
