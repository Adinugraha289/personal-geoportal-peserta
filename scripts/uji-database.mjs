#!/usr/bin/env node
// =====================================================================
// uji-database.mjs
//
// Menguji apakah database Anda sudah siap dipakai aplikasi: skema tabel,
// alur login, dan penyimpanan katalog. Jalankan setelah mengisi
// DATABASE_URL di .env dan menjalankan sql/01-schema.sql.
//
// Pakai:
//   node scripts/uji-database.mjs
//
// Membaca DATABASE_URL dari .env, atau dari variabel lingkungan.
//
// Skrip ini MEMBUAT data uji, lalu menghapusnya kembali di akhir. Data
// yang dihapus hanya yang dibuat skrip ini, dikenali dari alamat email
// dan nama layer yang dipakai di bawah.
// =====================================================================

import { readFileSync, existsSync } from 'node:fs';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

// ---------------------------------------------------------------------
// Ambil DATABASE_URL dari .env bila belum ada di lingkungan.
// ---------------------------------------------------------------------
if (!process.env.DATABASE_URL && existsSync('.env')) {
  const isi = readFileSync('.env', 'utf8');
  const cocok = isi.match(/^\s*DATABASE_URL\s*=\s*(.+)$/m);
  if (cocok) {
    process.env.DATABASE_URL = cocok[1].trim().replace(/^["']|["']$/g, '');
    console.log('DATABASE_URL dibaca dari .env');
  }
}

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL belum diisi.');
  console.error('Isi di .env, atau jalankan: DATABASE_URL="..." node scripts/uji-database.mjs');
  process.exit(1);
}

const db = new PrismaClient();
const hasil = [];
const catat = (nama, lulus, info = '') => hasil.push({ nama, lulus, info });

const EMAIL_UJI = 'uji-database@contoh.local';
const SANDI_UJI = 'KataSandiUji123';
const LAYER_UJI = 'geoportal:uji_database';

async function bersihkan() {
  await db.katalog_data_3d.deleteMany({ where: { nama: 'Uji Database' } });
  await db.katalog_data_2d.deleteMany({ where: { layer_name: LAYER_UJI } });
  await db.users.deleteMany({ where: { email: EMAIL_UJI } });
}

// ---------------------------------------------------------------------
// 1. Tiga tabel ada dan bisa dibaca
// ---------------------------------------------------------------------
for (const tabel of ['users', 'katalog_data_2d', 'katalog_data_3d']) {
  try {
    const jumlah = await db[tabel].count();
    catat(`tabel ${tabel} dapat dibaca`, true, `${jumlah} baris`);
  } catch (e) {
    catat(`tabel ${tabel} dapat dibaca`, false, e.message.split('\n')[0]);
  }
}

if (hasil.some((h) => !h.lulus)) {
  console.error('\nTabel belum lengkap. Jalankan sql/01-schema.sql lebih dahulu.');
  await db.$disconnect();
  prosesHasil();
}

await bersihkan();

// ---------------------------------------------------------------------
// 2. Menulis user baru, seperti src/app/api/users/register/route.js
// ---------------------------------------------------------------------
const userId = crypto.randomUUID();
await db.users.create({
  data: {
    user_id: userId,
    nama: 'Uji Database',
    email: EMAIL_UJI,
    password: await bcrypt.hash(SANDI_UJI, 10),
    role: 'editor',
    is_active: false,
  },
});
catat('menulis user baru', true, 'is_active=false, seperti hasil register');

// ---------------------------------------------------------------------
// 3. Pemeriksaan login, meniru lib/auth/verifyCredentials.js
//
// Logikanya ditulis ulang di sini karena berkas itu memakai impor tanpa
// ekstensi, yang hanya dikenali oleh bundler Next.js.
// ---------------------------------------------------------------------
async function periksaLogin(email, sandi) {
  const user = await db.users.findFirst({ where: { email } });
  if (!user) throw new Error('Email atau password salah!');
  if (!(await bcrypt.compare(sandi, user.password))) {
    throw new Error('Email atau password salah!');
  }
  if (!user.is_active) {
    const kontak = process.env.ADMIN_CONTACT_EMAIL || 'admin@example.com';
    throw new Error(`Akun anda belum di aktivasi. Silahkan request aktivasi ke email ${kontak}`);
  }
  return user;
}

try {
  await periksaLogin(EMAIL_UJI, SANDI_UJI);
  catat('akun belum aktif ditolak', false, 'seharusnya gagal, tetapi berhasil');
} catch (e) {
  catat('akun belum aktif ditolak', e.message.includes('aktivasi'), e.message);
}

try {
  await periksaLogin(EMAIL_UJI, 'sandi-salah');
  catat('kata sandi salah ditolak', false, 'seharusnya gagal');
} catch (e) {
  catat('kata sandi salah ditolak', e.message.includes('Email atau password salah'), e.message);
}

await db.users.update({ where: { email: EMAIL_UJI }, data: { is_active: true } });

try {
  const user = await periksaLogin(EMAIL_UJI, SANDI_UJI);
  catat('login setelah diaktifkan berhasil', user.role === 'editor', `role=${user.role}`);
} catch (e) {
  catat('login setelah diaktifkan berhasil', false, e.message);
}

// ---------------------------------------------------------------------
// 4. Menyimpan katalog, seperti src/app/api/katalog-data-*/create/route.js
// ---------------------------------------------------------------------
const id3d = crypto.randomUUID();
await db.katalog_data_3d.create({
  data: {
    data_3d_id: id3d,
    nama: 'Uji Database',
    akses: 'public',
    url: `http://localhost:3000/portal/api/katalog-data-3d/models/${id3d}`,
    latitude: -6.175,
    longitude: 106.827,
    heading: 0,
    pitch: 0,
    roll: 0,
    author: userId,
  },
});
catat('menyimpan katalog 3D', true, 'tanpa mengirim tipe_file');

// tipe_file tidak dideklarasikan di prisma/schema.prisma, sehingga Prisma
// tidak mengembalikannya. Nilainya dibaca langsung lewat SQL.
const [row3d] = await db.$queryRaw`
  SELECT tipe_file FROM katalog_data_3d WHERE data_3d_id = ${id3d}::uuid
`;
catat(
  'tipe_file terisi otomatis',
  row3d?.tipe_file === 'glb',
  `nilai di database: ${row3d?.tipe_file}`
);

await db.katalog_data_2d.create({
  data: {
    data_2d_id: crypto.randomUUID(),
    layer_name: LAYER_UJI,
    akses: 'public',
    is_editable: true,
    wms_url: 'http://contoh.local/geoserver/wms',
    wfs_url: 'http://contoh.local/geoserver/wfs',
    author: userId,
  },
});
catat('menyimpan katalog 2D', true, 'author terhubung ke users');

// ---------------------------------------------------------------------
// 5. Constraint di database bekerja
// ---------------------------------------------------------------------
try {
  await db.users.create({
    data: {
      user_id: crypto.randomUUID(), nama: 'Uji', email: 'peran@contoh.local',
      password: 'x', role: 'raja', is_active: true,
    },
  });
  catat('role tidak sah ditolak', false, 'seharusnya ditolak database');
} catch {
  catat('role tidak sah ditolak', true, 'CHECK users_role_valid bekerja');
}

try {
  await db.users.create({
    data: {
      user_id: crypto.randomUUID(), nama: 'Uji', email: EMAIL_UJI,
      password: 'x', role: 'editor', is_active: true,
    },
  });
  catat('email ganda ditolak', false, 'seharusnya ditolak database');
} catch {
  catat('email ganda ditolak', true, 'UNIQUE users_email_key bekerja');
}

await bersihkan();
await db.$disconnect();
prosesHasil();

function prosesHasil() {
  console.log('');
  console.log('HASIL UJI DATABASE');
  console.log('='.repeat(70));
  let gagal = 0;
  for (const h of hasil) {
    if (!h.lulus) gagal++;
    console.log(`  ${h.lulus ? 'LULUS' : 'GAGAL'}  ${h.nama.padEnd(34)} ${h.info}`);
  }
  console.log('='.repeat(70));
  console.log(`${hasil.length - gagal} lulus, ${gagal} gagal`);
  if (gagal) {
    console.log('');
    console.log('Periksa bagian "Bila Login Gagal" pada sql/README.md.');
  }
  process.exit(gagal ? 1 : 0);
}
