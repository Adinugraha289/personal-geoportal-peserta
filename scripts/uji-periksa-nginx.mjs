// Menguji pemeriksa nginx.conf dengan berkas yang sengaja dirusak.
// Jalankan: node scripts/uji-periksa-nginx.mjs
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const asli = readFileSync('nginx.conf', 'utf8');
const dir = mkdtempSync(path.join(tmpdir(), 'uji-nginx-'));

const kasus = [
  ['kurung kurawal kurang satu', asli.slice(0, asli.lastIndexOf('}'))],
  ['directive listen tanpa titik koma', asli.replace(/^(\s*)listen 80;/m, '$1listen 80')],
  ['proxy_pass tanpa titik koma', asli.replace('proxy_pass $nextjs_upstream;', 'proxy_pass $nextjs_upstream')],
  ['blok dibuka tanpa nama directive', asli.replace('location = / {', '{')],
  ['proxy_pass variabel tanpa resolver', asli.replace(/resolver[^;]+;/g, '')],
  ['kurung kurawal berlebih', `${asli}}\n`],
];

const jalankan = (berkas) => {
  try {
    return { kode: 0, keluaran: execFileSync('node', ['scripts/periksa-nginx.mjs', berkas], { encoding: 'utf8' }) };
  } catch (e) {
    return { kode: e.status, keluaran: e.stdout ?? '' };
  }
};

let gagal = 0;

// Berkas asli harus lolos
const berkasAsli = path.join(dir, 'asli.conf');
writeFileSync(berkasAsli, asli);
const hasilAsli = jalankan(berkasAsli);
if (hasilAsli.kode !== 0) {
  console.log('GAGAL: nginx.conf yang benar malah dilaporkan bermasalah');
  console.log(hasilAsli.keluaran);
  gagal++;
} else {
  console.log('LOLOS   | nginx.conf asli tanpa keluhan');
}

// Berkas rusak harus tertangkap
for (const [nama, isi] of kasus) {
  const berkas = path.join(dir, `${nama.replace(/\s+/g, '-')}.conf`);
  writeFileSync(berkas, isi);
  const hasil = jalankan(berkas);
  const tertangkap = hasil.kode !== 0;
  if (tertangkap) {
    console.log(`TANGKAP | ${nama}`);
  } else {
    console.log(`LUPA    | ${nama} tidak tertangkap`);
    gagal++;
  }
}

console.log(gagal === 0 ? '\nHASIL: pemeriksa bekerja benar' : `\nHASIL: ${gagal} masalah pada pemeriksa`);
process.exit(gagal === 0 ? 0 : 1);
