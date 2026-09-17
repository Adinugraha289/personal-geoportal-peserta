# Skema Database

Folder ini memuat skrip SQL untuk menyiapkan database Supabase yang dipakai aplikasi ini. Jalankan berurutan lewat SQL Editor Supabase, atau lewat DBeaver dan `psql`.

## Urutan Pengerjaan

| # | Berkas | Kapan dijalankan | Mengubah data? |
|---|---|---|---|
| 1 | `01-schema.sql` | Sekali, setelah project Supabase dibuat | Tidak, hanya membuat tabel |
| 2 | `02-seed-super-admin.sql` | Sekali, setelah skema ada | Ya, menambah satu baris di `users` |
| 3 | `03-periksa.sql` | Setelah langkah 1 dan 2 | Tidak, hanya membaca |
| 4 | `04-supabase-skema-gis.sql` | Saat membuat data spasial di PostGIS | Ya, mengubah `search_path` database |
| 5 | `05-diagnosa.sql` | Saat ada masalah koneksi PostGIS | Tidak, hanya membaca |

Berkas 1 sampai 3 menyiapkan tabel untuk login dan katalog. Berkas 4 dan 5 hanya diperlukan kalau Anda mengerjakan bagian data spasial PostGIS.

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

## Menjalankan Lewat Terminal

Kalau Anda memakai `psql` dan sudah mengisi `DATABASE_URL` pada `.env`:

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f sql/01-schema.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f sql/03-periksa.sql
```

Kedua berkas skema bersifat idempoten, memakai `CREATE TABLE IF NOT EXISTS`. Menjalankannya dua kali tidak menghapus data yang sudah ada.

## Menguji Hasilnya

Setelah skema terpasang dan `DATABASE_URL` terisi, jalankan:

```bash
node scripts/uji-database.mjs
```

Skrip itu memeriksa dua belas hal sekaligus: ketiga tabel dapat dibaca, akun belum aktif ditolak, kata sandi salah ditolak, login setelah diaktifkan berhasil, katalog 2D dan 3D dapat disimpan, serta constraint role dan unique email bekerja. Data ujinya dihapus kembali di akhir.

Kalau ada yang GAGAL, keluarannya menyebut bagian mana yang belum siap, sehingga Anda tidak perlu menebak.

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

1. **`DATABASE_URL` salah.** Cek dengan `psql "$DATABASE_URL" -c "SELECT 1"`. Pastikan memakai port 5432, bukan 6543.
2. **Tabel belum ada.** Jalankan `03-periksa.sql`, hasilnya harus menampilkan tiga tabel.
3. **Akun belum aktif.** `SELECT email, is_active FROM users;` lalu ubah `is_active` menjadi `true`.
4. **Kata sandi tidak cocok.** Periksa hash tersimpan dengan `node scripts/hash-password.mjs --cek '<hash>'`, lalu bandingkan memakai kata sandi aslinya.
5. **Pesan galat menyebut tabel tidak ditemukan.** Prisma membaca schema `public`. Pastikan ketiga tabel dibuat di schema `public`, bukan schema lain.
