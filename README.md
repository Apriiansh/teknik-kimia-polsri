<p align="center">
  <img src="/public/Logo Tekkim.png" alt="Logo Jurusan Teknik Kimia" width="120" />
</p>

<h1 align="center">Website Jurusan Teknik Kimia</h1>
<h3 align="center">Politeknik Negeri Sriwijaya</h3>

<p align="center">
  Sistem Informasi Akademik dan Profil Jurusan Teknik Kimia Politeknik Negeri Sriwijaya
</p>

<p align="center">
  <a href="#fitur"><strong>Fitur</strong></a> ·
  <a href="#tech-stack"><strong>Tech Stack</strong></a> ·
  <a href="#rendering-strategy"><strong>Rendering Strategy</strong></a> ·
  <a href="#struktur-project"><strong>Struktur Project</strong></a> ·
  <a href="#instalasi"><strong>Instalasi</strong></a>
</p>

---

## 📋 Tentang Project

Website resmi Jurusan Teknik Kimia Politeknik Negeri Sriwijaya yang berfungsi sebagai:
- Portal informasi publik (berita, kegiatan, kalender akademik, beasiswa)
- Profil jurusan (sejarah, visi misi, struktur organisasi, dosen & staff)
- Informasi program studi (D3 Teknik Kimia, D3 PSDKU SIAK, D4 Teknik Energi, D4 Teknologi Kimia Industri, S2 Energi Terbarukan)
- Informasi laboratorium (Lab Analisis, Lab Rekayasa, Lab Energi, Lab Mini Plant)
- Dashboard untuk berbagai role user (Admin, Dosen, Mahasiswa, Alumni, HMJ)

---

## ✨ Fitur

### 🌐 Halaman Publik
- **Beranda** - Hero carousel, statistik jurusan, berita terbaru, kegiatan, testimoni alumni
- **Profil Jurusan** - Sejarah, visi & misi, struktur organisasi, dosen & staff
- **Program Studi** - Informasi 5 program studi dengan kurikulum dan daftar dosen
- **Laboratorium** - Informasi 4 laboratorium dengan galeri dan daftar peralatan
- **Info & Berita** - Berita, pengumuman, kalender akademik, beasiswa, kegiatan
- **Direktori E-Book** - Koleksi buku elektronik

### 👨‍💼 Dashboard Admin
- **Data Management** - CRUD data dosen, mahasiswa, alumni
- **CMS (Content Management System)**
  - Manajemen berita & pengumuman
  - Manajemen kegiatan jurusan
  - Manajemen kalender akademik
  - Manajemen beasiswa
  - Manajemen konten profil (sejarah, visi misi, struktur organisasi)
  - Manajemen konten laboratorium
  - Manajemen konten program studi
  - Statistik mahasiswa per prodi
- **Kuesioner** - Pembuatan dan manajemen kuesioner
- **Pengaduan & Aspirasi** - Pengelolaan layanan mahasiswa

### 👨‍🏫 Dashboard Dosen
- Profil dosen dengan edit foto
- Manajemen penelitian & pengabdian
- Evaluasi hasil pembelajaran
- Pengaturan akun

### 👨‍🎓 Dashboard Mahasiswa
- Profil mahasiswa
- Pengisian kuesioner
- Pengaduan & aspirasi
- Pengaturan akun

### 🎓 Dashboard Alumni
- Profil alumni
- Testimoni alumni
- Riwayat pekerjaan

### 🏛️ Dashboard HMJ (Himpunan Mahasiswa Jurusan)
- Manajemen kegiatan HMJ
- Manajemen berita HMJ

---

## 🛠️ Tech Stack

### Framework & Runtime
| Teknologi | Versi | Keterangan |
|-----------|-------|------------|
| **Next.js** | 16.1.1 | React framework dengan App Router |
| **React** | 18.3.1 | UI library |
| **TypeScript** | 5.7.2 | Type safety |

### Backend & Database
| Teknologi | Keterangan |
|-----------|------------|
| **Supabase** | Backend-as-a-Service (PostgreSQL, Auth, Storage) |
| **@supabase/ssr** | Server-side rendering support untuk Supabase Auth |

### Styling & UI Components
| Teknologi | Keterangan |
|-----------|------------|
| **Tailwind CSS** | 3.4.17 - Utility-first CSS framework |
| **shadcn/ui** | Komponen UI berbasis Radix UI |
| **Radix UI** | Headless UI primitives (Dialog, Select, Tabs, dll) |
| **Lucide React** | Icon library |
| **Heroicons** | Icon library tambahan |
| **Framer Motion** | Animation library |

### Libraries Tambahan
| Teknologi | Keterangan |
|-----------|------------|
| **Swiper** | Carousel/slider component |
| **Recharts** | Chart library untuk visualisasi data |
| **React Hook Form** | Form handling |
| **date-fns** | Date utility |
| **React Day Picker** | Date picker component |
| **next-themes** | Dark/light mode theming |
| **Sonner** | Toast notifications |
| **pdfmake** | PDF generation |
| **Puppeteer** | Headless browser (PDF/screenshot) |

---

## 🔄 Rendering Strategy

Website ini menggunakan kombinasi berbagai strategi rendering Next.js untuk optimasi performa:

### SSG (Static Site Generation) dengan ISR
Halaman yang di-generate saat build time dengan Incremental Static Regeneration (revalidate setiap 1 jam):

| Halaman | Path | Keterangan |
|---------|------|------------|
| Program Studi | `/prodi/*` | D3 Teknik Kimia, D3 PSDKU, D4 Teknik Energi, D4 TKI, S2 Energi Terbarukan |
| Profil Dosen & Staff | `/profil/dosen_staff` | Server Component dengan data fetching |
| Profil Sejarah | `/profil/sejarah` | Konten statis |
| Visi & Misi | `/profil/visi_misi` | Konten statis |
| Struktur Organisasi | `/profil/struktur_organisasi` | Konten statis |

```typescript
// Contoh SSG dengan revalidate
export const revalidate = 3600; // Revalidate setiap 1 jam

export default async function D3TeknikKimiaPage() {
    const { prodiDetails, dosenList } = await getProdiData(...);
    return <ProdiClientContent ... />;
}
```

### SSR (Server-Side Rendering)
Halaman yang di-render di server pada setiap request:

| Halaman | Path | Keterangan |
|---------|------|------------|
| Detail Berita | `/info/berita/[slug]` | Dynamic route dengan data spesifik |
| Auth Callback | `/auth/callback` | OAuth handling |
| Protected Routes | `/protected/*` | Halaman terproteksi auth |
| Sign In/Up | `/sign-in`, `/sign-up` | Authentication pages |

### CSR (Client-Side Rendering)
Halaman dengan `'use client'` directive yang di-render di browser:

| Halaman | Path | Keterangan |
|---------|------|------------|
| **Beranda** | `/` | Hero carousel, animasi counter, data dinamis |
| **Dashboard Admin** | `/pages-admin/*` | CRUD operations, real-time data |
| **Dashboard Dosen** | `/pages-dosen/*` | Profil editing, form handling |
| **Dashboard Mahasiswa** | `/pages-mahasiswa/*` | Pengisian kuesioner, pengaduan |
| **Dashboard Alumni** | `/pages-alumni/*` | Profil & testimoni |
| **Dashboard HMJ** | `/pages-hmj/*` | Manajemen konten HMJ |
| **CMS Pages** | `/pages-admin/cms/*` | Content management dengan form |
| **Info Berita** | `/info/berita` | Search, filter, pagination client-side |
| **Info Kegiatan** | `/info/kegiatan` | Gallery dengan animasi |
| **Info Beasiswa** | `/info/beasiswa` | Filter dan search |
| **Laboratorium** | `/laboratorium/*` | Swiper carousel, interactive UI |

```typescript
// Contoh CSR
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function DashboardAdmin() {
    const [data, setData] = useState([]);
    // Client-side data fetching
}
```

### Hybrid Approach
Beberapa halaman menggunakan pendekatan hybrid:
- **Server Component** untuk data fetching awal
- **Client Component** untuk interaktivitas (search, filter, carousel)

```typescript
// Server Component (page.tsx)
export default async function DosenStaffPage() {
    const data = await getDosenData(); // Server-side fetch
    return <DosenStaffContent data={data} />; // Client component untuk interaktivitas
}
```

---

## 📁 Struktur Project

```
teknikkimia.polsri.ac.id/
├── app/
│   ├── (auth-pages)/          # Auth layouts (sign-in, sign-up, forgot-password)
│   ├── auth/                  # Auth callback
│   ├── direktori/             # E-book directory
│   ├── form/                  # Form components
│   ├── info/                  # Public info pages
│   │   ├── beasiswa/          # Scholarship info
│   │   ├── berita/            # News & announcements
│   │   ├── kalender/          # Academic calendar
│   │   └── kegiatan/          # Activities
│   ├── laboratorium/          # Lab pages (4 labs)
│   ├── pages-admin/           # Admin dashboard
│   │   ├── cms/               # Content Management System
│   │   ├── data-management/   # CRUD dosen, mahasiswa, alumni
│   │   ├── kuesioner/         # Questionnaire management
│   │   └── pengaduan_aspirasi/# Complaint handling
│   ├── pages-alumni/          # Alumni dashboard
│   ├── pages-dosen/           # Lecturer dashboard
│   ├── pages-hmj/             # Student organization dashboard
│   ├── pages-mahasiswa/       # Student dashboard
│   ├── prodi/                 # Study programs (5 programs)
│   ├── profil/                # Department profile
│   │   ├── dosen_staff/       # Lecturers & staff
│   │   ├── sejarah/           # History
│   │   ├── struktur_organisasi/
│   │   └── visi_misi/
│   ├── protected/             # Protected routes
│   ├── actions.ts             # Server actions
│   ├── alumni_actions.ts      # Alumni server actions
│   ├── dosen_actions.ts       # Lecturer server actions
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Homepage
├── components/
│   ├── ui/                    # shadcn/ui components
│   ├── Navbar.tsx             # Navigation bar
│   ├── Footer.tsx             # Footer
│   ├── SidebarAdmin.tsx       # Admin sidebar
│   ├── SidebarDosen.tsx       # Lecturer sidebar
│   ├── SidebarMahasiswa.tsx   # Student sidebar
│   ├── SidebarAlumni.tsx      # Alumni sidebar
│   └── SidebarHMJ.tsx         # HMJ sidebar
├── lib/
│   ├── data.ts                # Static data
│   └── utils.ts               # Utility functions
├── utils/
│   └── supabase/              # Supabase client configuration
│       ├── client.ts          # Browser client
│       ├── server.ts          # Server client
│       └── admin-client.ts    # Admin client
├── public/                    # Static assets
├── tailwind.config.ts         # Tailwind configuration
├── next.config.ts             # Next.js configuration
└── package.json
```

---

## 🚀 Instalasi

### Prerequisites
- Node.js 18+
- npm/yarn/pnpm
- Akun Supabase

### Langkah Instalasi

1. **Clone repository**
   ```bash
   git clone https://github.com/your-username/teknikkimia.polsri.ac.id.git
   cd teknikkimia.polsri.ac.id
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   
   Buat file `.env.local` dan isi dengan:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Jalankan development server**
   ```bash
   npm run dev
   ```

5. **Buka browser**
   
   Akses [http://localhost:3000](http://localhost:3000)

### Build Production

```bash
npm run build
npm run start
```

---

## 📄 Database Schema

Project ini menggunakan Supabase (PostgreSQL) dengan tabel-tabel utama:
- `dosen` - Data dosen
- `mahasiswa` - Data mahasiswa
- `alumni` - Data alumni
- `berita` - Berita & pengumuman
- `categories` - Kategori berita
- `kegiatan` - Kegiatan jurusan
- `kalender_akademik` - Kalender akademik
- `cms_beasiswa` - Data beasiswa
- `laboratorium` - Data laboratorium
- `jurusan_stats` - Statistik jurusan
- `kuesioner` - Kuesioner
- `pengaduan_aspirasi` - Layanan pengaduan
- `jabatan_struktural` - Jabatan struktural dosen

---

## 👥 Tim Pengembang

Jurusan Teknik Kimia - Politeknik Negeri Sriwijaya

---

## 📝 Lisensi

© 2024-2026 Jurusan Teknik Kimia Politeknik Negeri Sriwijaya. All Rights Reserved.
