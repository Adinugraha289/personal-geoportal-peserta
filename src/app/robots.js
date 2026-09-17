// Dihasilkan Next.js sebagai /portal/robots.txt.
//
// Karena aplikasi memakai basePath "/portal", berkas ini disajikan di bawah
// /portal. Mesin pencari selalu meminta /robots.txt di akar domain, sehingga
// nginx.conf memuat blok location yang meneruskan permintaan dari akar.
export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Halaman admin dan seluruh endpoint API ditutup. Jangan menambahkan
      // halaman ini ke sitemap, karena keduanya akan saling bertentangan.
      disallow: ['/portal/internal/', '/portal/api/']
    },
    sitemap: 'https://ujissl.dhanypedia.it.com/portal/sitemap.xml'
  };
}
