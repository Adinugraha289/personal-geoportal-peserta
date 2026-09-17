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

## Urutan Pengerjaan

1. Fork repositori ini, lalu clone fork Anda.
2. Buat project di [supabase.com](https://supabase.com), lalu jalankan skrip di folder `sql/` mengikuti [sql/README.md](sql/README.md).
3. Jalankan `npm install`, lalu salin `.env.example` menjadi `.env` dan isi nilainya.
4. Jalankan aplikasi di perangkat sendiri dengan `npm run dev`.
5. Setelah berjalan, lanjutkan ke tahap deployment di Google Cloud.

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
