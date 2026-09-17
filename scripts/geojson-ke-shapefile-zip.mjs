// Mengubah GeoJSON menjadi shapefile (.shp, .shx, .dbf, .prj) lalu membungkusnya
// menjadi satu berkas zip, karena store shapefile tersedia di GeoServer bawaan
// sedangkan store GeoJSON tidak.
//
// Jalankan: node scripts/geojson-ke-shapefile-zip.mjs <input.geojson> <output.zip>
import { readFileSync, writeFileSync } from 'node:fs';
import { deflateRawSync } from 'node:zlib';

const sumber = process.argv[2] ?? 'public/data/batas_admin.geojson';
const tujuan = process.argv[3] ?? '/tmp/batas_admin.zip';
const namaDasar = (tujuan.split('/').pop() ?? 'layer').replace(/\.zip$/, '');

// ---------- utilitas biner ----------

// Spesifikasi shapefile memakai dua urutan byte yang berbeda. Header record
// memakai big-endian, sedangkan seluruh isi record dan header utama memakai
// little-endian. Karena itu ada dua penulis terpisah, dan mencampurnya
// menghasilkan berkas yang terbaca sebagai angka raksasa.
class Penulis {
  constructor() { this.bagian = []; }
  uint8(v) { this.bagian.push(Buffer.from([v & 0xff])); return this; }
  int32BE(v) { const b = Buffer.alloc(4); b.writeInt32BE(v | 0); this.bagian.push(b); return this; }
  int32LE(v) { const b = Buffer.alloc(4); b.writeInt32LE(v | 0); this.bagian.push(b); return this; }
  double(v) { const b = Buffer.alloc(8); b.writeDoubleLE(v); this.bagian.push(b); return this; }
  bytes(buf) { this.bagian.push(buf); return this; }
  buffer() { return Buffer.concat(this.bagian); }
}

// ---------- tabel DBF ----------

function tulisDbf(properti, fitur) {
  const p = new Penulis();
  const jumlah = fitur.length;
  // Batas nama kolom DBF adalah 10 karakter. Nama asli disimpan terpisah supaya
  // pemetaan nilai tidak bergantung pada pencarian nama yang bisa tertukar.
  const kolom = properti.map((n) => ({ asli: n, nama: n.slice(0, 10), tipe: 'C', panjang: 80 }));

  const header = Buffer.alloc(32);
  header.writeUInt8(0x03, 0);            // versi
  header.writeUInt32LE(jumlah, 4);       // jumlah record
  const panjangRecord = 1 + kolom.reduce((a, k) => a + k.panjang, 0);
  header.writeUInt16LE(32 + kolom.length * 32 + 1, 8); // offset awal data
  header.writeUInt16LE(panjangRecord, 10);
  p.bytes(header);

  for (const k of kolom) {
    const d = Buffer.alloc(32);
    d.write(k.nama, 0, 'latin1');
    d.write(k.tipe, 11, 'latin1');
    d.writeUInt8(k.panjang, 16);
    d.writeUInt8(0, 17);
    p.bytes(d);
  }
  p.uint8(0x0d); // penanda akhir definisi kolom

  for (const f of fitur) {
    p.uint8(0x20); // record aktif
    for (const k of kolom) {
      const nilai = f.properties?.[k.asli] ?? '';
      const teks = String(nilai).slice(0, k.panjang).padEnd(k.panjang, ' ');
      p.bytes(Buffer.from(teks, 'latin1'));
    }
  }
  p.uint8(0x1a); // EOF
  return p.buffer();
}

// ---------- geometri SHP ----------

const tipeGeometri = { MultiPolygon: 5, Polygon: 5 };

function cincinPoligon(rings) {
  // SHP tidak menyimpan ring; satu poligon dikirim sebagai satu daftar titik
  const titik = [];
  for (const r of rings) for (const c of r) titik.push(c);
  return titik;
}

function tulisShp(fitur, namaLayer) {
  const body = new Penulis();
  const index = new Penulis();
  let offset = 50; // header utama 100 byte = 50 word

  fitur.forEach((f, i) => {
    const tipe = tipeGeometri[f.geometry.type];
    if (!tipe) throw new Error(`tipe geometri tidak didukung: ${f.geometry.type}`);

    const poligon = f.geometry.type === 'Polygon'
      ? [f.geometry.coordinates]
      : f.geometry.coordinates;

    const semuaTitik = poligon.flatMap(cincinPoligon);
    const xs = semuaTitik.map((c) => c[0]);
    const ys = semuaTitik.map((c) => c[1]);
    const kotak = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];

    const isi = new Penulis();
    isi.int32LE(tipe);
    for (const v of kotak) isi.double(v);
    isi.int32LE(poligon.length);                  // jumlah bagian
    isi.int32LE(semuaTitik.length);               // jumlah titik
    let mulai = 0;
    for (const p of poligon) {
      isi.int32LE(mulai);
      mulai += cincinPoligon([p]).length;
    }
    for (const c of semuaTitik) { isi.double(c[0]); isi.double(c[1]); }

    const isiBuf = isi.buffer();
    const panjangWord = isiBuf.length / 2;

    const rec = new Penulis();
    rec.int32BE(i + 1);
    rec.int32BE(panjangWord);
    rec.bytes(isiBuf);
    body.bytes(rec.buffer());

    index.int32BE(offset);
    index.int32BE(panjangWord);
    offset += 4 + panjangWord;
  });

  const bodyBuf = body.buffer();
  const semuaTitik = fitur.flatMap((f) => (f.geometry.type === 'Polygon'
    ? [f.geometry.coordinates] : f.geometry.coordinates).flatMap(cincinPoligon));
  const xs = semuaTitik.map((c) => c[0]);
  const ys = semuaTitik.map((c) => c[1]);

  const kepala = Buffer.alloc(100);
  kepala.writeInt32BE(9994, 0);                                   // kode berkas
  kepala.writeInt32BE((100 + bodyBuf.length) / 2, 24);            // panjang berkas dalam word
  kepala.writeInt32LE(1000, 28);                                  // versi
  kepala.writeInt32LE(5, 32);                                     // tipe shape
  kepala.writeDoubleLE(Math.min(...xs), 36);
  kepala.writeDoubleLE(Math.min(...ys), 44);
  kepala.writeDoubleLE(Math.max(...xs), 52);
  kepala.writeDoubleLE(Math.max(...ys), 60);

  const shp = Buffer.concat([kepala, bodyBuf]);

  const kepalaIndex = Buffer.alloc(100);
  kepalaIndex.writeInt32BE(9994, 0);
  kepalaIndex.writeInt32BE((100 + index.buffer().length) / 2, 24);
  kepalaIndex.writeInt32LE(1000, 28);
  kepalaIndex.writeInt32LE(5, 32);
  kepalaIndex.writeDoubleLE(Math.min(...xs), 36);
  kepalaIndex.writeDoubleLE(Math.min(...ys), 44);
  kepalaIndex.writeDoubleLE(Math.max(...xs), 52);
  kepalaIndex.writeDoubleLE(Math.max(...ys), 60);

  return { shp, shx: Buffer.concat([kepalaIndex, index.buffer()]) };
}

// ---------- ZIP ----------

function crc32(buf) {
  let c;
  const tabel = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    tabel[n] = c >>> 0;
  }
  let crc = 0xffffffff;
  for (const b of buf) crc = tabel[(crc ^ b) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function buatZip(entri) {
  const lokal = [];
  const pusat = [];
  let offset = 0;

  for (const { nama, data } of entri) {
    const namaBuf = Buffer.from(nama, 'utf8');
    const terkompresi = deflateRawSync(data);
    const crc = crc32(data);

    const lh = Buffer.alloc(30);
    lh.writeUInt32LE(0x04034b50, 0);
    lh.writeUInt16LE(20, 4);
    lh.writeUInt16LE(0, 6);
    lh.writeUInt16LE(8, 8);                 // deflate
    lh.writeUInt32LE(crc, 14);
    lh.writeUInt32LE(terkompresi.length, 18);
    lh.writeUInt32LE(data.length, 22);
    lh.writeUInt16LE(namaBuf.length, 26);
    lokal.push(lh, namaBuf, terkompresi);

    const ch = Buffer.alloc(46);
    ch.writeUInt32LE(0x02014b50, 0);
    ch.writeUInt16LE(20, 4);
    ch.writeUInt16LE(20, 6);
    ch.writeUInt16LE(8, 10);
    ch.writeUInt32LE(crc, 16);
    ch.writeUInt32LE(terkompresi.length, 20);
    ch.writeUInt32LE(data.length, 24);
    ch.writeUInt16LE(namaBuf.length, 28);
    ch.writeUInt32LE(offset, 42);
    pusat.push(ch, namaBuf);

    offset += lh.length + namaBuf.length + terkompresi.length;
  }

  const pusatBuf = Buffer.concat(pusat);
  const akhir = Buffer.alloc(22);
  akhir.writeUInt32LE(0x06054b50, 0);
  akhir.writeUInt16LE(entri.length, 8);
  akhir.writeUInt16LE(entri.length, 10);
  akhir.writeUInt32LE(pusatBuf.length, 12);
  akhir.writeUInt32LE(offset, 16);

  return Buffer.concat([...lokal, pusatBuf, akhir]);
}

// ---------- alur utama ----------

const geo = JSON.parse(readFileSync(sumber, 'utf8'));
const properti = Object.keys(geo.features[0].properties);
const { shp, shx } = tulisShp(geo.features, namaDasar);
const dbf = tulisDbf(properti, geo.features);
const prj = Buffer.from(
  'GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137.0,298.257223563]],'
  + 'PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]]',
  'utf8'
);

writeFileSync(tujuan, buatZip([
  { nama: `${namaDasar}.shp`, data: shp },
  { nama: `${namaDasar}.shx`, data: shx },
  { nama: `${namaDasar}.dbf`, data: dbf },
  { nama: `${namaDasar}.prj`, data: prj }
]));

console.log(`Berkas dibuat: ${tujuan}`);
console.log(`Jumlah fitur: ${geo.features.length}`);
console.log(`Kolom DBF: ${properti.map((n) => n.slice(0, 10)).join(', ')}`);
console.log('Isi zip: .shp, .shx, .dbf, .prj');
