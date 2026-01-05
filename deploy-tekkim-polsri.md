# 📦 Panduan Deployment ke cPanel (Terminal + Application Manager)

Folder ini berisi file-file untuk deployment Next.js standalone ke cPanel.

## ⚠️ PENTING
Folder ini di-gitignore untuk keamanan. Jangan commit file sensitif ke repository.

---

## 📁 Struktur Deployment

```
/home/username/
├── public_html/
│   └── .htaccess           ← HANYA file ini (proxy ke Node.js)
│
└── server/
    └── standalone/         ← SEMUA file aplikasi di sini
        ├── server.js       ← Entry point
        ├── package.json
        ├── .env            ← Environment variables
        ├── public/         ← Static assets (gambar, dll) - TETAP DI SINI
        │   ├── logo-polsri.jpg
        │   ├── slide1.jpg
        │   └── ...
        └── .next/
            └── static/     ← Build assets (JS, CSS)
```

> **CATATAN**: Folder `public/` TETAP di dalam `standalone/`, BUKAN di `public_html`!
> Next.js akan serve static files dari folder `public/` secara otomatis.

---

## 🚀 Langkah Deployment

### 1. Build Project (di lokal)
```bash
npm run build
```

### 2. Siapkan Folder Standalone
```bash
# Copy folder public ke standalone
cp -r public .next/standalone/

# Copy folder static ke standalone/.next/
cp -r .next/static .next/standalone/.next/

# Copy file .env.production
cp .env.production .next/standalone/.env
```

### 3. Compress untuk Upload
```bash
cd .next
zip -r standalone.zip standalone/
```

### 4. Upload ke cPanel
1. Login ke cPanel
2. Buka **File Manager**
3. Buat folder `server` di root (`/home/username/`)
4. Upload `standalone.zip` ke folder `server`
5. **Extract** file zip tersebut
6. Hasil: `/home/username/server/standalone/`

### 5. Setup .htaccess di public_html
1. Navigasi ke `public_html`
2. Upload file `.htaccess` dari folder `deploy` ini
3. File `.htaccess` sudah include proxy rule ke Node.js

### 6. Jalankan Server via Terminal cPanel (RECOMMENDED)
```bash
# Login ke cPanel Terminal atau SSH
ssh username@domain.com

# Buka screen session baru
screen -S nextjs

# Masuk ke folder standalone
cd ~/server/standalone

# Set permission .env
chmod 600 .env

# Jalankan server dengan HOSTNAME dan PORT
HOSTNAME="0.0.0.0" PORT=3000 /opt/cpanel/ea-nodejs22/bin/node server.js
```

**Output yang benar:**
```
▲ Next.js 16.1.1
- Local:         http://localhost:3000
- Network:       http://0.0.0.0:3000

✓ Starting...
✓ Ready in 115ms
```

Tekan `Ctrl+A` lalu `D` untuk detach dari screen, server tetap running.

### 7. Testing
Akses di browser: `https://teknikkimia.polsri.ac.id/`

Jika berhasil:
- Homepage tampil normal
- Halaman lain bisa diakses
- Assets (gambar) terbuka

---

## 🔐 Catatan Keamanan .htaccess

File `.htaccess` yang disediakan sudah include:
- ✅ Security Headers (XSS, Clickjacking, MIME sniffing)
- ✅ Block SQL Injection patterns
- ✅ Block malicious bots & crawlers
- ✅ Block gambling/judol referrers
- ✅ Protect sensitive files (.env, .git, dll)
- ✅ Rate limiting (method restriction)
- ✅ GZIP compression
- ✅ Browser caching

---

## 🔧 Troubleshooting

### Server tidak jalan
- Cek apakah port sudah benar
- Pastikan Node.js version compatible (18+)
- Cek log error: `cat ~/server/standalone/error.log`

### 502 Bad Gateway
- Server Node.js belum running
- Port tidak sesuai dengan .htaccess
- Cek screen session: `screen -r nextjs`

### Website blank/error
- Pastikan folder `public` dan `.next/static` ada di dalam `standalone`
- Cek environment variables di `.env`

### Gambar/Assets tidak muncul
- Pastikan folder `public/` ada di dalam `standalone/`
- JANGAN pindahkan `public/` ke `public_html`
- Next.js serve static files langsung dari folder `public/`

### Restart Server
```bash
# Lihat screen sessions
screen -ls

# Masuk ke session
screen -r nextjs

# Stop dengan Ctrl+C, lalu jalankan ulang
HOSTNAME="0.0.0.0" PORT=3000 /opt/cpanel/ea-nodejs22/bin/node server.js
```

---

## 📝 Catatan Penting

1. **public_html** hanya berisi `.htaccess` untuk proxy
2. **Semua file aplikasi** ada di `/server/standalone/`
3. **Static assets** (gambar, dll) di-serve oleh Next.js dari `standalone/public/`
4. Gunakan `screen` agar server tetap jalan setelah logout SSH

---

## 🖥️ Panduan Screen (Session Management)

### Apa itu Screen?
Screen adalah terminal multiplexer yang membuat proses tetap berjalan meskipun kamu logout dari SSH/Terminal.

### Perintah Dasar Screen

| Perintah | Fungsi |
|----------|--------|
| `screen -S nama` | Buat session baru dengan nama |
| `screen -ls` | Lihat semua session aktif |
| `screen -r nama` | Masuk ke session yang ada |
| `screen -d nama` | Detach session dari luar |
| `screen -d -r nama` | Detach lalu attach (paksa masuk) |
| `Ctrl+A` lalu `D` | Detach dari dalam session |
| `Ctrl+A` lalu `K` | Kill session dari dalam |
| `exit` | Keluar & tutup session |

### Cara Menghindari Zombie Screen

**1. Selalu beri nama session:**
```bash
# ✅ Bagus - mudah diidentifikasi
screen -S nextjs

# ❌ Hindari - susah diingat
screen
```

**2. Cek session sebelum buat baru:**
```bash
# Lihat dulu ada session apa
screen -ls

# Kalau sudah ada, masuk ke yang existing
screen -r nextjs

# Jangan buat baru kalau sudah ada!
```

**3. Bersihkan dead/zombie sessions:**
```bash
# Lihat semua sessions
screen -ls

# Hapus session yang dead
screen -wipe

# Kill session tertentu dari luar
screen -X -S nama_session quit

# Kill SEMUA screen sessions (hati-hati!)
killall screen
```

**4. Jangan tutup terminal langsung!**
```bash
# ✅ Benar - detach dulu
Ctrl+A lalu D
# Baru tutup terminal

# ❌ Salah - langsung tutup browser/terminal
# Bisa menyebabkan session "Attached" tapi tidak bisa diakses
```

### Masalah Umum Screen

**Session "Attached" tapi tidak bisa masuk:**
```bash
# Paksa detach lalu attach
screen -d -r nextjs
```

**Banyak zombie sessions:**
```bash
# Bersihkan semua dead sessions
screen -wipe

# Kalau masih ada, kill manual
screen -ls
# Contoh output: 12345.nextjs (Dead ???)
screen -X -S 12345.nextjs quit
```

**Lupa nama session:**
```bash
screen -ls
# Output:
# There are screens on:
#     12345.nextjs    (Detached)
#     67890.pts-0.server    (Detached)
```

### Workflow Aman untuk Server

**Pertama kali deploy:**
```bash
screen -S nextjs
cd ~/server/standalone
HOSTNAME="0.0.0.0" PORT=3000 /opt/cpanel/ea-nodejs22/bin/node server.js
# Ctrl+A, D untuk detach
```

**Restart server:**
```bash
# Masuk ke session
screen -r nextjs

# Stop server
Ctrl+C

# Jalankan ulang
HOSTNAME="0.0.0.0" PORT=3000 /opt/cpanel/ea-nodejs22/bin/node server.js

# Detach
Ctrl+A, D
```

**Kalo Server Mati:**
```bash
screen -r nextjs
cd ~/server/standalone
HOSTNAME="0.0.0.0" PORT=3000 /opt/cpanel/ea-nodejs22/bin/node server.js
Pastikan Ctrl+A, D sebelum menutup tab atau browser
```

**Update deployment:**
```bash
# 1. Stop server
screen -r nextjs
Ctrl+C

# 2. Keluar session (jangan kill)
Ctrl+A, D

# 3. Upload file baru, extract, dll

# 4. Masuk lagi & jalankan
screen -r nextjs
HOSTNAME="0.0.0.0" PORT=3000 /opt/cpanel/ea-nodejs22/bin/node server.js
Ctrl+A, D
```

### Tips Pro

1. **Satu server = Satu session** - Jangan buat banyak session untuk satu aplikasi
2. **Nama deskriptif** - `nextjs`, `teknikkimia`, bukan `test1`, `aaa`
3. **Cek rutin** - `screen -ls` sebelum buat session baru
4. **Bersihkan berkala** - `screen -wipe` untuk hapus dead sessions
5. **Log output** - Pertimbangkan redirect output ke file:
   ```bash
   HOSTNAME="0.0.0.0" PORT=3000 /opt/cpanel/ea-nodejs22/bin/node server.js > app.log 2>&1
   ```
