# Skema Database

Folder ini memuat skrip SQL untuk menyiapkan database Supabase yang dipakai aplikasi ini. Jalankan berurutan lewat SQL Editor Supabase, atau lewat DBeaver dan `psql`.

## Urutan Pengerjaan

| # | Berkas | Kapan dijalankan | Mengubah data? |
|---|---|---|---|
| 1 | `01-schema.sql` | Sekali, setelah project Supabase dibuat | Tidak, hanya membuat tabel |
| 2 | `02-seed-super-admin.sql` | Setelah langkah 1 | Ya, menambah satu baris di `users` |
| 3 | `03-periksa.sql` | Setelah langkah 2 | Tidak, hanya membaca |
| 4 | `05-diagnosa-constraint.sql` | Bila ada kegagalan constraint | Tidak, hanya membaca |
| 5 | `04-postgis-supabase.sql` | Hanya untuk data spasial, baca catatan di bawah | Ya, mengubah `search_path` database |

Berkas 1 sampai 3 menyiapkan tabel untuk login dan katalog, dan itu cukup untuk membuat aplikasi berjalan. Berkas 4 dan 5 hanya diperlukan kalau Anda mengerjakan bagian data spasial PostGIS.

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

- `password` menyimpan hash bcrypt, bukan kata sandi asli. Buat hashnya dengan `node scripts/hash-password.mjs`.
- `is_active` bernilai `false` untuk setiap akun baru. Selama `false`, login ditolak dengan pesan yang meminta aktivasi. Ubah menjadi `true` untuk mengaktifkan akun.

Nilai `role` dibatasi pada `viewer`, `editor`, `admin`, dan `super_admin` oleh constraint di database. Endpoint pembuatan user hanya menerima `editor` dan `admin`, sedangkan `super_admin` diisi lewat `02-seed-super-admin.sql`.

### katalog_data_2d dan katalog_data_3d

Keduanya menyimpan metadata katalog, bukan berkas datanya. Kolom `author` menunjuk ke `users.user_id`.

`katalog_data_3d.tipe_file` punya nilai bawaan `'glb'`. Kolom itu tidak pernah dikirim aplikasi saat menyimpan data 3D, sehingga tanpa nilai bawaan setiap penyimpanan akan gagal dengan `null value in column "tipe_file" violates not-null constraint`.

## Kata Sandi Database

Jangan menyimpan kata sandi polos di kolom `password`. Alur yang benar:

```bash
# 1. buat hash, kata sandi diminta lewat prompt tersembunyi
node scripts/hash-password.mjs

# 2. salin hasilnya, lalu isi pada blok DO di 02-seed-super-admin.sql
#    bersama alamat email super admin
```

Skrip itu memakai bcryptjs dengan cost 12 dan menghasilkan nilai berawalan `$2b$12$`, sama dengan yang dihasilkan `bcrypt.hashSync` di dalam aplikasi. Keduanya bisa saling memeriksa.

## Menguji Hasilnya

Setelah skema terpasang dan `DATABASE_URL` terisi, jalankan:

```bash
node scripts/uji-database.mjs
```

Skrip itu memeriksa dua belas hal sekaligus: ketiga tabel dapat dibaca, akun belum aktif ditolak, kata sandi salah ditolak, login setelah diaktifkan berhasil, katalog 2D dan 3D dapat disimpan, serta constraint role dan unique email bekerja. Data ujinya dihapus kembali di akhir.

Kalau ada yang GAGAL, keluarannya menyebut bagian mana yang belum siap, sehingga Anda tidak perlu menebak.

## Data Spasial PostGIS

Bagian ini berlaku hanya kalau Anda membuat tabel spasial di schema `gis`.

### Yang perlu dilakukan: cukup buat schema gis

Di project Supabase yang baru dibuat, satu perintah ini sudah cukup:

```sql
CREATE SCHEMA IF NOT EXISTS gis;
```

Setelah itu Anda bisa membuat tabel dengan kolom `geometry` dan memanggil `AddGeometryColumn` dari QGIS maupun DBeaver tanpa pengaturan tambahan.

Alasannya, peran `postgres` di Supabase sudah membawa `search_path` bawaan yang memuat schema `extensions`, tempat sebagian besar extension Supabase dipasang:

```
"$user", public, extensions
```

Jadi tipe `geometry` dan fungsi PostGIS selalu terjangkau, di schema mana pun PostGIS mendarat.

### Yang tidak perlu: mengunci search_path

Modul Praktik 6 memuat perintah berikut untuk PostgreSQL lokal:

```sql
ALTER DATABASE namadatabase SET search_path TO gis, public;
```

Perintah itu tidak diperlukan di Supabase, dan ada dua alasan:

1. Bila PostGIS dipasang di schema `gis`, maka `gis` sudah ada di `search_path` sehingga tidak ada masalah yang perlu diperbaiki.
2. Bila PostGIS dipasang di schema `extensions`, `extensions` sudah ada di `search_path` bawaan peran `postgres`, sehingga juga tidak ada masalah.

Yang membuat galat muncul bukan `search_path` bawaannya, melainkan mengunci `search_path` sehingga `extensions` keluar dari jangkauan:

```
SET search_path TO gis, public;   -- extensions hilang dari jangkauan
CREATE TABLE uji (geom geometry(Point,4326));
ERROR:  type "geometry" does not exist
```

Perhatikan bahwa galat di atas muncul justru karena `search_path` dikunci, bukan sebelum dikunci.

`04-postgis-supabase.sql` tetap disediakan untuk dua keperluan:

- Diagnosa. Bagian pertamanya hanya membaca, dan bisa dipakai memastikan di schema mana PostGIS benar-benar mendarat di akun Anda.
- Project lama. Sebagian project Supabase yang dibuat sebelum 2025 memasang PostGIS di schema `extensions` sekaligus mengunci `search_path` peran `postgres` ke `gis, public`. Pada project seperti itu skrip ini diperlukan.

Satu catatan teknis bila Anda menjalankannya: `ALTER DATABASE ... SET search_path` di dalam skrip itu tertimpa oleh setelan tingkat peran. Peran `postgres` di Supabase memiliki setelan sendiri, dan setelan peran selalu menang atas setelan database. Karena itu, bila bagian diagnosa menunjukkan `extensions` sudah terjangkau, tidak ada yang perlu diubah.

## Mengosongkan Tabel

Kalau Anda perlu memulai dari nol, jalankan perintah berikut di SQL Editor. Perintah ini menghapus seluruh isi ketiga tabel:

```sql
DROP VIEW  IF EXISTS v_katalog_2d_lengkap;
DROP TABLE IF EXISTS katalog_data_2d CASCADE;
DROP TABLE IF EXISTS katalog_data_3d CASCADE;
DROP TABLE IF EXISTS users           CASCADE;
```

Setelah itu jalankan `01-schema.sql` lagi untuk membuat ulang tabelnya.

## Bila Login Gagal

Periksa berurutan:

1. DATABASE_URL salah. Cek dengan `psql "$DATABASE_URL" -c "SELECT 1"`. Pastikan memakai port 5432, bukan 6543.
2. Tabel belum ada. Jalankan `03-periksa.sql`, hasilnya harus menampilkan tiga tabel.
3. Akun belum aktif. `SELECT email, is_active FROM users;` lalu ubah `is_active` menjadi `true`.
4. Kata sandi tidak cocok. Periksa hash tersimpan dengan `node scripts/hash-password.mjs --cek '<hash>'`, lalu bandingkan memakai kata sandi aslinya.
5. Pesan galat menyebut tabel tidak ditemukan. Prisma membaca schema `public`. Pastikan ketiga tabel dibuat di schema `public`, bukan schema lain.
6. Masih gagal. Jalankan `05-diagnosa-constraint.sql`, yang memeriksa sepuluh hal sekaligus dan diakhiri tabel keputusan: gejala mana menunjuk ke perbaikan mana.
