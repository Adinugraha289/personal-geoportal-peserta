// Verifikasi mandiri berkas shapefile hasil skrip konversi, tanpa pustaka luar.
// Membaca kembali .shp, .shx, dan .dbf untuk memastikan strukturnya benar.
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const zip = process.argv[2] ?? '/tmp/batas_admin.zip';
const dasar = (zip.split('/').pop() ?? '').replace(/\.zip$/, '');
const tmp = '/tmp/verifikasi-shapefile';

execFileSync('rm', ['-rf', tmp]);
execFileSync('mkdir', ['-p', tmp]);
execFileSync('unzip', ['-o', '-q', zip, '-d', tmp]);

const gagal = [];
const cek = (syarat, pesan) => { if (!syarat) gagal.push(pesan); };

// --- SHP ---
const shp = readFileSync(`${tmp}/${dasar}.shp`);
cek(shp.readInt32BE(0) === 9994, 'kode berkas SHP salah');
const panjangWord = shp.readInt32BE(24);
cek(panjangWord * 2 === shp.length, `panjang SHP tidak cocok: header ${panjangWord * 2}, berkas ${shp.length}`);
cek(shp.readInt32LE(32) === 5, 'tipe shape bukan polygon');
const [xmin, ymin, xmax, ymax] = [36, 44, 52, 60].map((o) => shp.readDoubleLE(o));
cek(xmin < xmax && ymin < ymax, `kotak batas SHP tidak valid: ${xmin},${ymin},${xmax},${ymax}`);

// --- SHX ---
const shx = readFileSync(`${tmp}/${dasar}.shx`);
cek(shx.readInt32BE(0) === 9994, 'kode berkas SHX salah');
const jumlahRecord = (shx.length - 100) / 8;
cek(Number.isInteger(jumlahRecord), 'panjang SHX bukan kelipatan record');

// --- baca tiap record dari SHX lalu ambil geometrinya dari SHP ---
let totalTitik = 0;
for (let i = 0; i < jumlahRecord; i++) {
  const offsetWord = shx.readInt32BE(100 + i * 8);
  const isiWord = shx.readInt32BE(104 + i * 8);
  const posisi = offsetWord * 2;
  cek(shp.readInt32BE(posisi) === i + 1, `nomor record ${i + 1} tidak cocok`);
  cek(shp.readInt32BE(posisi + 4) === isiWord, `panjang record ${i + 1} tidak cocok dengan SHX`);
  const tipe = shp.readInt32LE(posisi + 8);
  cek(tipe === 5, `record ${i + 1} bukan polygon`);
  // Tata letak isi record: tipe (4) + kotak batas (32) + jumlah bagian (4) + jumlah titik (4)
  const bagian = shp.readInt32LE(posisi + 8 + 36);
  const titik = shp.readInt32LE(posisi + 8 + 40);
  cek(bagian >= 1, `record ${i + 1} tidak punya bagian`);
  cek(titik >= 4, `record ${i + 1} titiknya kurang dari 4`);
  totalTitik += titik;
}

// --- DBF ---
const dbf = readFileSync(`${tmp}/${dasar}.dbf`);
const jumlahDbf = dbf.readUInt32LE(4);
const panjangRecord = dbf.readUInt16LE(10);
const offsetData = dbf.readUInt16LE(8);
const jumlahKolom = (offsetData - 33) / 32;
cek(Number.isInteger(jumlahKolom), 'jumlah kolom DBF tidak bulat');
cek(jumlahDbf === jumlahRecord, `jumlah record DBF ${jumlahDbf} tidak sama dengan SHX ${jumlahRecord}`);
cek(offsetData + jumlahDbf * panjangRecord <= dbf.length, 'data DBF melebihi panjang berkas');
const kolom = [];
for (let i = 0; i < jumlahKolom; i++) {
  const dasar = 32 + i * 32;
  // Offset 16 menyimpan panjang kolom, offset 17 menyimpan jumlah desimal
  kolom.push({
    nama: dbf.toString('latin1', dasar, dasar + 11).replace(/\0.*$/, '').trim(),
    panjang: dbf.readUInt8(dasar + 16)
  });
}
const namaKolom = kolom.map((k) => k.nama);

// Baris pertama: mulai setelah penanda hapus (1 byte), lalu tiap kolom
const nilaiBaris1 = [];
let geser = offsetData + 1;
for (const k of kolom) {
  nilaiBaris1.push(dbf.toString('latin1', geser, geser + k.panjang).trim());
  geser += k.panjang;
}
cek(geser === offsetData + panjangRecord, 'jumlah panjang kolom tidak sama dengan panjang record');
cek(nilaiBaris1.every((v) => v.length > 0), 'ada kolom yang kosong pada baris pertama');

// Jumlah titik harus sama dengan yang dihitung dari isi record SHP
const titikDariShx = (() => {
  let total = 0;
  for (let i = 0; i < jumlahRecord; i++) {
    const off = shx.readInt32BE(100 + i * 8) * 2;
    total += shp.readInt32LE(off + 8 + 40);
  }
  return total;
})();
cek(titikDariShx === totalTitik, `jumlah titik dari SHX ${titikDariShx} tidak sama dengan ${totalTitik}`);

// --- PRJ ---
const prj = readFileSync(`${tmp}/${dasar}.prj`, 'utf8');
cek(prj.includes('WGS_1984'), 'berkas PRJ tidak menyebut WGS_1984');

console.log('=== hasil verifikasi mandiri ===');
console.log(`fitur          : ${jumlahRecord}`);
console.log(`total titik    : ${totalTitik}`);
console.log(`kolom DBF      : ${namaKolom.join(', ')}`);
console.log(`baris pertama  : ${nilaiBaris1.join(' | ')}`);
console.log(`kotak batas    : ${xmin} ${ymin} ${xmax} ${ymax}`);
console.log(`proyeksi       : ${prj.slice(0, 40)}...`);
console.log(gagal.length === 0 ? 'HASIL: SEMUA STRUKTUR VALID' : `HASIL: ${gagal.length} masalah`);
for (const g of gagal) console.log(' -', g);
