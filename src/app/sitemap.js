// Dihasilkan Next.js sebagai /portal/sitemap.xml.
//
// Hanya halaman publik yang didaftarkan. Halaman /portal/internal justru
// ditutup pada robots.js, jadi mendaftarkannya di sini akan bertentangan.
export default function sitemap() {
  const base = 'https://ujissl.dhanypedia.it.com/portal';

  return [
    { url: base, priority: 1 },
    { url: `${base}/peta-latihan-1`, priority: 0.8 }
  ];
}
