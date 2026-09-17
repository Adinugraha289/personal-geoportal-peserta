// Mengubah GeoJSON menjadi CSV dengan kolom WKT, karena store GeoJSON
// tidak tersedia pada instalasi GeoServer bawaan.
import { readFileSync, writeFileSync } from 'node:fs';

const sumber = process.argv[2] ?? 'public/data/batas_admin.geojson';
const tujuan = process.argv[3] ?? '/tmp/batas_admin.csv';

const ring = (r) => r.map((c) => `${c[0].toFixed(6)} ${c[1].toFixed(6)}`).join(', ');

function toWkt(geom) {
  if (geom.type === 'Polygon') {
    const cincin = geom.coordinates.map((r) => `(${ring(r)})`).join(', ');
    return `POLYGON (${cincin})`;
  }
  if (geom.type === 'MultiPolygon') {
    const poligon = geom.coordinates
      .map((p) => `(${p.map((r) => `(${ring(r)})`).join(', ')})`)
      .join(', ');
    return `MULTIPOLYGON (${poligon})`;
  }
  throw new Error(`tipe geometri tidak didukung: ${geom.type}`);
}

const esc = (v) => {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const geo = JSON.parse(readFileSync(sumber, 'utf8'));
const properti = Object.keys(geo.features[0].properties);
const baris = [['WKT', ...properti].join(',')];

for (const f of geo.features) {
  baris.push([toWkt(f.geometry), ...properti.map((p) => esc(f.properties[p]))].join(','));
}

writeFileSync(tujuan, `${baris.join('\n')}\n`);
console.log(`Berkas dibuat: ${tujuan}`);
console.log(`Jumlah fitur: ${baris.length - 1}`);
console.log(`Kolom: WKT, ${properti.join(', ')}`);
console.log(`Contoh: ${baris[1].slice(0, 120)} ...`);
