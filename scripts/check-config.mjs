import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

// YAML dimuat lewat createRequire karena paket ini berbentuk CommonJS,
// sehingga import bernama tidak tersedia di berkas .mjs.
const YAML = createRequire(import.meta.url)('yaml');

const names = ['docker-compose.yml', 'cloudbuild.yaml'];
let failed = false;

for (const file of names) {
  try {
    const data = YAML.parse(readFileSync(file, 'utf8'));
    console.log('OK   ' + file + ' -> ' + Object.keys(data).join(', '));
    if (names[0] === file) {
      const services = Object.keys(data.services ?? {});
      console.log('     service: ' + services.join(', '));
      if (services.length !== 3) {
        console.error('     HARUS 3 service, ditemukan ' + services.length);
        failed = true;
      }
    }
  } catch (error) {
    console.error('GAGAL ' + file + ': ' + error.message);
    failed = true;
  }
}

process.exit(failed ? 1 : 0);
