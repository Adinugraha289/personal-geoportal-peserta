#!/usr/bin/env node
// =====================================================================
// hash-password.mjs
//
// Menggantikan langkah manual di Praktik 8 dan Praktik 9:
//
//   node        # masuk REPL
//   const bcrypt = require('bcryptjs');
//   const hash = bcrypt.hashSync('PasswordRahasia123', 10);
//   console.log(hash);
//
// kemudian salin hasilnya dan paste ke kolom password lewat klien database.
//
// Cara itu punya tiga masalah:
//   - hasilnya harus disalin manual, gampang salah ketik
//   - password asli tertinggal di history terminal dan di scrollback
//   - tidak bisa diulang oleh orang lain dengan hasil yang sama
//
// Skrip ini membaca password dari argumen, variabel lingkungan, atau
// prompt tersembunyi (tidak muncul di layar dan tidak masuk history).
//
// Pakai:
//   node hash-password.mjs                      # prompt tersembunyi
//   node hash-password.mjs --cek '$2b$10$...'   # periksa apakah sebuah nilai hash bcrypt
//   PASSWORD=rahasia node hash-password.mjs     # lewat variabel lingkungan
//   node hash-password.mjs --cost 12            # tentukan cost
//
// Hasilnya dipakai pada sql/02-seed-super-admin.sql. Salin hash yang
// tercetak, lalu tempel pada penanda <ISI_HASH_DI_SINI> di berkas itu,
// dan jalankan berkasnya lewat SQL Editor Supabase.
// =====================================================================

import { createInterface } from 'node:readline';

const argv = process.argv.slice(2);
const idxCek = argv.indexOf('--cek');
const idxCost = argv.indexOf('--cost');

// ---------------------------------------------------------------------
// Mode --cek: memeriksa apakah sebuah nilai sudah berupa hash bcrypt.
// Dipakai sebelum menulis ke database, supaya password polos tidak
// pernah tersimpan.
// ---------------------------------------------------------------------
if (idxCek > -1) {
  const nilai = argv[idxCek + 1] ?? '';
  const cocok = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(nilai);
  if (cocok) {
    const cost = Number(nilai.slice(4, 6));
    console.log('Hash bcrypt yang sah.');
    console.log(`  cost    : ${cost}${cost < 10 ? '  (terlalu rendah, minimal 10)' : ''}`);
    console.log(`  awalan  : ${nilai.slice(0, 7)}`);
    process.exit(cost < 10 ? 1 : 0);
  }
  console.error('BUKAN hash bcrypt.');
  console.error('  Hash bcrypt berbentuk $2a$10$... atau $2b$12$... dengan panjang 60 karakter.');
  if (nilai && !nilai.startsWith('$2')) {
    console.error('  Nilai yang diberikan terlihat seperti password polos. Jangan simpan ke database.');
  }
  process.exit(1);
}

// ---------------------------------------------------------------------
// Tentukan cost. Bawaan 12, bukan 10: 10 masih diterima, tetapi makin
// murah perangkat keras, makin murah pula menebak. Praktik memakai 10.
// ---------------------------------------------------------------------
const cost = idxCost > -1 ? Number(argv[idxCost + 1]) : 12;
if (!Number.isInteger(cost) || cost < 10 || cost > 15) {
  console.error('Cost harus bilangan bulat antara 10 dan 15.');
  process.exit(2);
}

// ---------------------------------------------------------------------
// Ambil password.
// ---------------------------------------------------------------------
function tanyaTersembunyi(pertanyaan) {
  return new Promise((selesai) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    const asli = rl._writeToOutput?.bind(rl);
    // Jangan tampilkan ketikan.
    rl._writeToOutput = function (teks) {
      if (teks.includes(pertanyaan)) asli?.(teks);
    };
    rl.question(pertanyaan, (jawaban) => {
      rl._writeToOutput = asli;
      rl.close();
      process.stdout.write('\n');
      selesai(jawaban);
    });
  });
}

let password = process.env.PASSWORD ?? null;

if (!password) {
  const posisi = argv.find((a) => !a.startsWith('--') && a !== String(cost));
  if (posisi) {
    password = posisi;
    console.error('Catatan: password diberikan sebagai argumen, sehingga tercatat di history shell.');
    console.error('Lebih aman: jalankan tanpa argumen untuk memasukkan lewat prompt tersembunyi.');
  }
}

if (!password) {
  if (!process.stdin.isTTY) {
    console.error('Tidak ada password. Pakai PASSWORD=... atau jalankan di terminal interaktif.');
    process.exit(2);
  }
  password = await tanyaTersembunyi('Password: ');
  const ulang = await tanyaTersembunyi('Ulangi  : ');
  if (password !== ulang) {
    console.error('Password tidak sama.');
    process.exit(1);
  }
}

if (password.length < 8) {
  console.error('Password minimal 8 karakter.');
  process.exit(1);
}

// ---------------------------------------------------------------------
// Hitung hash. bcryptjs dicari dari beberapa lokasi supaya skrip ini bisa
// dipakai baik dari dalam proyek Next.js maupun dari folder review.
// ---------------------------------------------------------------------
async function muatBcrypt() {
  const kandidat = ['bcryptjs', 'bcrypt'];
  for (const nama of kandidat) {
    try {
      return { nama, mod: await import(nama) };
    } catch { /* coba berikutnya */ }
  }
  return null;
}

const bcrypt = await muatBcrypt();
if (!bcrypt) {
  console.error('Paket bcryptjs tidak ditemukan.');
  console.error('Pasang lebih dahulu:  npm install bcryptjs');
  console.error('Atau hitung di dalam folder proyek Next.js, lalu jalankan skrip ini dari sana.');
  process.exit(3);
}

const mod = bcrypt.mod.default ?? bcrypt.mod;
const mulai = Date.now();
const hash = await mod.hash(password, cost);
const durasi = Date.now() - mulai;

// Keluarkan HANYA hash ke stdout, supaya bisa dipakai dengan $( ).
console.log(hash);
console.error('');
console.error(`Pustaka : ${bcrypt.nama}, cost ${cost}, ${durasi} ms`);
console.error('');
console.error('Cara memakainya:');
console.error('  1. Buka sql/02-seed-super-admin.sql');
console.error('  2. Ganti <ISI_EMAIL_DI_SINI> dengan email Anda');
console.error(`  3. Ganti <ISI_HASH_DI_SINI> dengan hash di atas (${hash.slice(0, 10)}...)`);
console.error('  4. Salin seluruh isi berkas itu ke SQL Editor Supabase, lalu Run');
console.error('');
console.error('Jangan pernah menyimpan password polos ke kolom password.');
