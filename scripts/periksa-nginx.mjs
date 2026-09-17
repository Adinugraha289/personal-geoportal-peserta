// Pemeriksa berkas konfigurasi Nginx yang berjalan dengan Node.js saja.
// Tidak memerlukan Docker maupun Podman, supaya semua asisten bisa memakainya
// di sistem operasi apa pun.
//
// Jalankan: node scripts/periksa-nginx.mjs nginx.conf
import { readFileSync } from 'node:fs';

const berkas = process.argv[2] ?? 'nginx.conf';
const isi = readFileSync(berkas, 'utf8');

// Buang komentar, tetapi hormati tanda kutip supaya tanda # di dalam nilai aman.
function tanpaKomentar(teks) {
  let hasil = '';
  let kutip = null;
  for (let i = 0; i < teks.length; i++) {
    const c = teks[i];
    if (kutip) {
      hasil += c;
      if (c === kutip && teks[i - 1] !== '\\') kutip = null;
      continue;
    }
    if (c === '"' || c === "'") { kutip = c; hasil += c; continue; }
    if (c === '#') { while (i < teks.length && teks[i] !== '\n') i++; hasil += '\n'; continue; }
    hasil += c;
  }
  return hasil;
}

const bersih = tanpaKomentar(isi);

// Token: directive sebagai teks, ditambah { } ;
function tokenisasi(teks) {
  const token = [];
  let buf = '';
  for (let i = 0; i < teks.length; i++) {
    const c = teks[i];
    if (c === '"' || c === "'") {
      let nilai = c;
      i++;
      while (i < teks.length && teks[i] !== c) { nilai += teks[i]; i++; }
      buf += nilai;
      continue;
    }
    if (c === '{' || c === '}' || c === ';') {
      if (buf.trim()) token.push({ tipe: 'teks', nilai: buf.trim() });
      token.push({ tipe: c });
      buf = '';
      continue;
    }
    buf += c;
  }
  if (buf.trim()) token.push({ tipe: 'teks', nilai: buf.trim() });
  return token;
}

const token = tokenisasi(bersih);
const masalah = [];
const namaBlok = [];
let kedalaman = 0;

// Periksa struktur per baris. Pendekatan ini dipilih karena menghilangkan titik
// koma membuat dua baris menyatu menjadi satu, sehingga jumlah titik koma pada
// baris itu menjadi kurang dari jumlah pernyataannya.
const barisKode = bersih.split('\n');
barisKode.forEach((baris, nomor) => {
  const t = baris.trim();
  if (!t) return;

  const kurungBuka = (t.match(/\{/g) ?? []).length;
  const kurungTutup = (t.match(/\}/g) ?? []).length;
  const titikKoma = (t.match(/;/g) ?? []).length;

  // Baris yang hanya membuka blok wajib menyebut nama direktifnya lebih dahulu,
  // misalnya "server {" atau "location / {". Kurung buka tanpa nama direktif
  // membuat Nginx menolak seluruh berkas.
  if (kurungBuka > 0 && kurungTutup === 0) {
    const tanpaKurung = t.replace(/[{};]/g, '').trim();
    if (!tanpaKurung) {
      masalah.push(`baris ${nomor + 1}: blok dibuka tanpa nama directive di depannya`);
    }
    return;
  }
  if (kurungBuka === 0 && kurungTutup > 0 && titikKoma === 0) return;

  // Satu pernyataan pada satu baris wajib diakhiri titik koma, kecuali baris
  // itu membuka blok yang ditutup pada baris yang sama.
  if (titikKoma === 0) {
    masalah.push(`baris ${nomor + 1}: "${t.slice(0, 50)}" tidak diakhiri titik koma`);
    return;
  }

  // Lebih dari satu pernyataan pada satu baris hanya sah bila ada blok di
  // dalamnya, misalnya "location / { proxy_pass ...; }".
  if (titikKoma > 1 && kurungBuka === 0) {
    masalah.push(`baris ${nomor + 1}: ada ${titikKoma} pernyataan tanpa blok, kemungkinan baris menyatu karena titik koma hilang`);
  }
});

// Periksa keseimbangan kurung kurawal secara keseluruhan
const totalBuka = (bersih.match(/\{/g) ?? []).length;
const totalTutup = (bersih.match(/\}/g) ?? []).length;
if (totalBuka !== totalTutup) {
  masalah.push(`kurung kurawal tidak seimbang, ${totalBuka} buka dan ${totalTutup} tutup`);
}

// Periksa hal yang bergantung antar directive.
const proxy = [...bersih.matchAll(/proxy_pass\s+([^;]+);/g)].map((m) => m[1].trim());
// Setelah alamat resolver masih ada opsi lain, misalnya valid dan ipv6,
// jadi polanya harus menangkap sampai titik koma, bukan satu kata saja.
const adaResolver = /resolver\s+[^;]+;/.test(bersih);
const pakaiVariabel = proxy.some((p) => p.startsWith('$'));

if (pakaiVariabel && !adaResolver) {
  masalah.push('proxy_pass memakai variabel tetapi tidak ada directive resolver, nama upstream tidak akan terselesaikan');
}
if (!/server\s*\{/.test(bersih)) masalah.push('tidak ada blok server');
if (!/listen\s+\d+/.test(bersih)) masalah.push('tidak ada directive listen');
if (proxy.length === 0) masalah.push('tidak ada proxy_pass sama sekali');

console.log(`Berkas       : ${berkas}`);
console.log(`proxy_pass   : ${proxy.length > 0 ? proxy.join(', ') : '(tidak ada)'}`);
console.log(`resolver     : ${adaResolver ? 'ada' : 'tidak ada'}`);

if (masalah.length === 0) {
  console.log('HASIL: struktur konfigurasi valid');
  process.exit(0);
}
console.log(`HASIL: ${masalah.length} masalah`);
for (const m of masalah) console.log(` - ${m}`);
process.exit(1);
