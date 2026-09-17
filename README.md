# Personal Geoportal

Aplikasi WebGIS untuk pelatihan: peta 2D dengan Leaflet, peta 3D dengan CesiumJS, katalog data, dan autentikasi. Berjalan di atas Next.js, PostgreSQL dengan PostGIS, dan GeoServer.

Repositori ini adalah titik awal peserta. Konfigurasi deploy sudah tersedia di dalamnya, sehingga yang perlu Anda kerjakan adalah menyiapkan database dan menjalankan aplikasinya.

## Isi Repositori

| Bagian | Keterangan |
|---|---|
| `src/` | Kode halaman dan endpoint API |
| `lib/` | Autentikasi, koneksi database, dan fungsi pendukung |
| `prisma/` | Definisi model database, dibaca Prisma Client |
| `sql/` | Skrip SQL untuk menyiapkan tabel di Supabase. Urutannya ada di [sql/README.md](sql/README.md) |
| `scripts/` | Pemeriksa konfigurasi dan pembuat hash kata sandi |
| `Dockerfile` | Cara aplikasi dibangun menjadi image container |
| `docker-compose.yml` | Tiga service: `nextjs`, `geoserver`, `nginx` |
| `nginx.conf` | Rute `/portal`, GeoServer, ACME, dan TLS |
| `cloudbuild.yaml` | Otomatisasi build saat push ke branch `main` |
| `.env.example` | Daftar variabel lingkungan beserta penjelasannya |

## Yang Perlu Disiapkan

| Kebutuhan | Keterangan |
|---|---|
| Node.js | Sudah dipasang sejak Hari 1. Dipakai menjalankan aplikasi dan skrip di folder `scripts/` |
| Akun Supabase | Gratis. Satu akun untuk satu peserta |
| Akun GitHub | Untuk fork repositori ini |
| Akses Google Cloud | Dari koordinator, untuk tahap deployment |

Tidak perlu memasang klien database. Seluruh perintah SQL dijalankan lewat SQL Editor di dashboard Supabase, yang sudah ada di browser.

## Urutan Pengerjaan

Kerjakan berurutan. Langkah 1 sampai 5 dikerjakan di laptop, langkah 6 dan seterusnya di VM.

### 1. Fork dan clone

Fork repositori ini di akun GitHub Anda, lalu clone fork tersebut.

### 2. Buat project Supabase

Buka [supabase.com/dashboard](https://supabase.com/dashboard), lalu buat project baru:

| Kolom | Nilai |
|---|---|
| Name | Bebas, misalnya `geoportal-nama-anda` |
| Database Password | Buat kata sandi, lalu **simpan**. Nilainya dibutuhkan pada langkah 4 |
| Region | Southeast Asia (Singapore), supaya dekat dengan VM nanti |

Tunggu sekitar dua menit sampai project selesai dibuat.

Catatan penting untuk pengguna paket gratis: **satu akun Supabase dibatasi dua project aktif.** Jadi satu akun untuk satu peserta, jangan membuat beberapa project untuk satu peserta. Kalau kuota habis, hapus atau pause project yang tidak dipakai.

### 3. Jalankan skrip SQL

Ikuti [sql/README.md](sql/README.md). Di sana dijelaskan apa itu SQL Editor dan cara memakainya. Tiga berkas pertama yang perlu dijalankan: `01-schema.sql`, `02-seed-super-admin.sql`, dan `03-periksa.sql`.

Setelah langkah ini Anda sudah punya akun super admin untuk masuk ke portal.

### 4. Isi berkas .env

```bash
npm install
cp .env.example .env
```

Buka `.env`, lalu isi bagian **WAJIB**. Berkas itu sudah dibagi menjadi tiga bagian dengan keterangan di dalamnya. Yang perlu Anda isi hanya empat nilai:

| Variabel | Dari mana |
|---|---|
| `DATABASE_URL` | Tombol Connect di dashboard Supabase, pilih ORM/Prisma |
| `JWT_SECRET` | Hasil perintah acak |
| `NEXTAUTH_SECRET` | Hasil perintah acak, harus berbeda dari di atas |
| `ADMIN_CONTACT_EMAIL` | Email Anda sendiri |

Perintah untuk membuat dua nilai acak, pilih sesuai sistem Anda:

```bash
# macOS atau Linux
openssl rand -hex 32

# Windows, PowerShell, atau Command Prompt
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 5. Jalankan di laptop

```bash
npm run dev
```

Buka [http://localhost:3000/portal](http://localhost:3000/portal), lalu masuk memakai akun super admin dari langkah 3.

### 6. Deployment ke VM

Setelah portal berjalan di laptop, lanjutkan ke tahap deployment di Google Cloud. Panduannya ada di modul Praktik 11 pada situs materi pelatihan.

## Koneksi ke Supabase

Satu bagian ini sering salah, jadi dibaca pelan-pelan.

Supabase menyediakan tiga bentuk connection string, dan **hanya satu yang bekerja** dengan Prisma:

| Bentuk | Port | Hasil |
|---|---|---|
| `db.<ref>.supabase.co` | 5432 | Gagal. Pada project baru host ini hanya punya alamat IPv6 |
| `aws-0-<region>.pooler.supabase.com` | 6543 | Gagal. Transaction pooler tidak mendukung prepared statement yang dipakai Prisma |
| **`aws-0-<region>.pooler.supabase.com`** | **5432** | **Bekerja. Ini yang dipakai** |

Perhatikan juga bentuk nama penggunanya, yaitu `postgres.<ref>`, bukan `postgres` saja. `<ref>` adalah Reference ID project yang terlihat pada URL dashboard.

Contoh lengkap:

```
DATABASE_URL="postgresql://postgres.abcdefghijklm:kata-sandi-anda@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
```

Kalau kata sandi Anda memuat karakter khusus seperti `@` atau `#`, tulis dalam bentuk persen: `%40` dan `%23`.

## Perintah

```bash
npm install                    # memasang dependensi, sekaligus menjalankan prisma generate
npm run dev                    # menjalankan aplikasi di http://localhost:3000/portal

node scripts/check-config.mjs  # memeriksa docker-compose.yml dan cloudbuild.yaml
node scripts/periksa-nginx.mjs # memeriksa struktur nginx.conf
node scripts/hash-password.mjs # membuat hash bcrypt untuk kolom password
node scripts/uji-database.mjs  # menguji skema, login, dan penyimpanan katalog
```

`node scripts/uji-database.mjs` memeriksa dua belas hal sekaligus: ketiga tabel
dapat dibaca, akun belum aktif ditolak, kata sandi salah ditolak, login setelah
diaktifkan berhasil, katalog 2D dan 3D dapat disimpan, serta constraint dan
unique email bekerja. Jalankan setelah menjalankan `sql/01-schema.sql`. Skrip
itu membuat data uji lalu menghapusnya kembali.

## Data Spasial

Untuk mengunggah layer 2D ke katalog, dibutuhkan PostGIS dan GeoServer. Dua hal ini berbeda dan sering tertukar:

| | Schema |
|---|---|
| PostGIS dipasang di | `public` |
| Tabel spasial dibuat di | `gis` |

**PostGIS harus di schema `public`.** GeoServer memeriksa versi PostGIS lewat `postgis_lib_version()`, dan fungsi itu hanya ditemukan dari schema `public`. Bila PostGIS dipasang di `gis`, GeoServer gagal terhubung dan unggahan layer selalu gagal dengan pesan kosong.

**Tabel spasial tetap di schema `gis`,** sesuai kesepakatan pelatihan. Isi kolom schema pada datastore GeoServer dengan `gis`, dan isi `POSTGIS_SCHEMA=gis` pada `.env`.

Urutannya berpengaruh: aktifkan PostGIS lebih dahulu, baru buat datastore di GeoServer. Penjelasan lengkapnya ada di [sql/README.md](sql/README.md).

## Konfigurasi Penting

`next.config.mjs` memuat dua pengaturan yang tidak boleh diubah tanpa menyesuaikan berkas lain:

- `output: "standalone"` diperlukan karena `Dockerfile` menyalin folder `.next/standalone`. Tanpa itu, build image gagal.
- `basePath: "/portal"` membuat seluruh alamat halaman diawali `/portal`, sesuai rute di `nginx.conf`. Tanpa itu, Nginx mengalihkan ke `/portal` tetapi aplikasi tidak menyajikan halaman di sana.

`trailingSlash` sengaja tidak diaktifkan. Mengaktifkannya bersama `basePath` pernah menghasilkan `ERR_TOO_MANY_REDIRECTS`, karena Nginx dan Next.js saling mengalihkan antara `/portal` dan `/portal/`.

## Menjalankan dengan Docker di Perangkat Sendiri

```bash
cp .env.example .env      # isi nilainya lebih dahulu
docker compose up -d --no-deps geoserver nginx
```

Service `nextjs` belum bisa dinyalakan sebelum ada image, karena nilainya dibaca dari `NEXTJS_IMAGE` di `.env`.

---

Dokumentasi asli Next.js dipertahankan di bawah ini.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
