export default function manifest() {
  return {
    name: 'Sistem Informasi Teknik Kimia',
    short_name: 'Tekkim POLSRI',
    description: 'Website resmi Teknik Kimia Politeknik Negeri Sriwijaya',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#800000',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}