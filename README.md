# Shang Yun (尚韵) — Imperial Lunar New Year Luxury Crafts

Aplikasi web e-katalog pusaka dan sistem manajemen multi-peran (Admin, Seller, Pembeli) untuk produk UMKM kerajinan tangan / cenderamata mewah Tahun Baru Imlek (*Chinese New Year*).

---

## 🚀 Tech Stack & Infrastructure

- **Framework**: [Astro 5](https://astro.build/) (Static Site Generation & Islands Architecture)
- **Front-End UI**: [Svelte 5](https://svelte.dev/) (Reactive UI Components & State Stores)
- **Database**: [Neon](https://neon.tech/) Serverless PostgreSQL (`@neondatabase/serverless`) dengan fallback lokal dummy
- **Image Storage CDN**: [Cloudinary](https://cloudinary.com/) (Direct Unsigned Image Uploads & On-The-Fly Resizing)
- **Deployment Platform**: [Cloudflare Pages](https://pages.cloudflare.com/) (`@astrojs/cloudflare` + `wrangler.json`)
- **3D & Visual Motion**: [Three.js](https://threejs.org/) (Partikel Debu Emas 3D) & [GSAP](https://greensock.com/gsap/)
- **Styling**: Vanilla CSS tema *Imperial Luxury Chinese New Year* (Merah Lakur, Kuningan, Kertas Champagne, Tinta Hitam)

---

## 👥 3 Peran Pengguna (Roles)

1. **Pembeli (Customer)**:
   - Menjelajahi katalog karya Imlek.
   - Filter pencarian, kategori, dan filter per perajin (seller).
   - Memesan via WhatsApp langsung ke nomor pengrajin pembuat karya tersebut.
   - Hak akses terbatas hanya belanja (tanpa tombol upload/edit).
2. **Seller (Mitra Perajin)**:
   - Mengunggah karya baru beserta foto langsung ke Cloudinary CDN.
   - Mengelola stok, harga, dan penanda unggulan karya tokonya sendiri.
   - Mengatur nomor WhatsApp tokonya sendiri untuk menerima pesanan langsung dari pembeli.
3. **Admin (Platform Administrator)**:
   - Menambahkan mitra seller/pengrajin baru ke platform.
   - Memantau metrik agregat seluruh toko di platform (Total Seller, Total Produk, Total Stok, Total Nilai Inventaris).
   - Mengawasi seluruh katalog produk dan mengatur kunci Cloudinary.

---

## 📁 Struktur Berkas

```
shangyun/
├── schema.sql                 # Skema DDL PostgreSQL untuk Neon (sellers, products, users)
├── wrangler.json              # Konfigurasi deploy Cloudflare Pages
├── astro.config.mjs           # Konfigurasi Astro + Svelte + Cloudflare Adapter
├── .env.example               # Contoh konfigurasi Neon & Cloudinary
├── package.json
└── src/
    ├── lib/
    │   ├── db.js              # Abstraksi Neon PostgreSQL + Local Dummy Fallback
    │   └── cloudinary.js      # Layanan upload & optimasi foto Cloudinary CDN
    ├── stores/
    │   └── store.js           # Svelte Reactive Stores ($currentRole, $sellers, $items)
    ├── data/
    │   └── seed.js            # 8 Data pusaka awal & helper fungsi
    ├── components/
    │   ├── TopNav.svelte       # Navigasi + Role Switcher (Pembeli, Seller, Admin)
    │   ├── Hero.svelte         # Ranting plum, kaligrafi 尚韵, & puisi Imlek
    │   ├── Story.svelte        # Cerita pengrajin & pita kertas tinta (#ink)
    │   ├── Catalog.svelte      # Etalase produk pembeli & link WA seller
    │   ├── Dashboard.svelte    # Dashboard dinamis Seller & Admin
    │   ├── ProductDialog.svelte# Modal upload produk ke Cloudinary CDN
    │   ├── SellerDialog.svelte # Modal pendaftaran seller baru oleh Admin
    │   ├── ParallaxController.svelte
    │   └── Toast.svelte
    ├── layouts/
    │   └── Layout.astro        # Layout utama & filter SVG ink
    ├── pages/
    │   ├── index.astro         # Halaman utama (/)
    │   └── dashboard.astro     # Halaman dashboard (/dashboard)
    └── styles/
        └── global.css          # Desain token tema luxury Imlek
```

---

## 🛠️ Cara Menjalankan Secara Lokal

### 1. Jalankan Dev Server
```powershell
cd d:\ekraf\shangyun
pnpm dev
```
Buka browser di `http://localhost:4321`.

### 2. Konfigurasi Database Neon (Opsional)
Salin `.env.example` menjadi `.env` dan masukkan connection string Neon:
```env
DATABASE_URL="postgresql://user:password@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require"
```
*Catatan: Tanpa `.env`, aplikasi tetap berjalan 100% normal menggunakan engine dummy bawaan.*

### 3. Konfigurasi Cloudinary (Opsional)
Masukkan cloud name dan unsigned upload preset di `.env` atau langsung di panel Dashboard Admin:
```env
PUBLIC_CLOUDINARY_CLOUD_NAME="my_cloud_name"
PUBLIC_CLOUDINARY_UPLOAD_PRESET="shangyun_unsigned_preset"
```

---

## ☁️ Panduan Deploy ke Cloudflare Pages

### Opsi A: Deploy Langsung via CLI (Wrangler)
```powershell
# 1. Build aplikasi untuk produksi
pnpm build

# 2. Deploy ke Cloudflare Pages
npx wrangler pages deploy dist --project-name shangyun
```

### Opsi B: Deploy Otomatis via Git (Cloudflare Dashboard)
1. Hubungkan repositori GitHub/GitLab di dashboard [Cloudflare Pages](https://dash.cloudflare.com/).
2. Tentukan pengaturan build:
   - **Framework Preset**: `Astro`
   - **Build Command**: `pnpm build`
   - **Build Output Directory**: `dist`
3. Tambahkan Environment Variables di menu **Settings > Environment variables**:
   - `DATABASE_URL` (dari Neon)
   - `PUBLIC_CLOUDINARY_CLOUD_NAME` (dari Cloudinary)
   - `PUBLIC_CLOUDINARY_UPLOAD_PRESET` (dari Cloudinary)
4. Klik **Save and Deploy**. Situs web Anda akan aktif secara instan di jaringan CDN global Cloudflare!
