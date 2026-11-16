# SPEC.md — Shang Yun 尚韵

Katalog dan dashboard multi-peran (Admin, Seller, Pembeli) produk UMKM kerajinan tangan dan suvenir Imlek bertema mewah dan elegan.
Arsitektur didesain dengan **Astro 5 + Svelte 5 + PostgreSQL (Neon) + Cloudinary CDN**, siap dideploy ke **Cloudflare Pages**.

---

## 1. Tujuan

- Menampilkan katalog produk Imlek dengan kesan premium: lukisan tinta, kertas champagne, merah lakur, hitam, dan kuningan.
- Memungkinkan **pembeli** mencari, memfilter per kategori atau per seller pengrajin, mengurutkan, dan memesan langsung via WhatsApp ke seller bersangkutan.
- Memungkinkan **seller** mengunggah karya beserta foto langsung ke **Cloudinary CDN**, mengelola stok, harga, deskripsi, dan nomor kontak WhatsApp tokonya.
- Memungkinkan **admin** mendaftarkan seller baru, mengatur kredensial Cloudinary, memantau kinerja seluruh seller dan katalog platform, serta mengawasi integritas data.
- Menggunakan arsitektur database **PostgreSQL (Neon)** dengan mode dummy/local fallback untuk kemudahan latihan dan kesiapan deploy cloud.
- Menggunakan infrastruktur hosting serverless global **Cloudflare Pages**.

---

## 2. Pengguna & Hak Akses (3 Peran)

| Peran | Tanggung Jawab & Hak Akses | Fitur Utama |
|---|---|---|
| **Admin** | Pengelola platform tertinggi | Menambahkan seller baru, mengatur konfigurasi Cloudinary, memantau metrik total seller/produk/stok, meninjau seluruh katalog dari semua seller |
| **Seller** | Mitra UMKM / Pengrajin | Mengunggah produk baru (terintegrasi upload Cloudinary), mengedit/menghapus produk toko sendiri, memperbarui stok & harga, mengatur nomor WhatsApp pemesanan toko |
| **Pembeli** | Pelanggan / Tamu (Guest) | Menjelajahi katalog, mencari karya, memfilter kategori & seller, melihat detail karya, dan memesan via WhatsApp langsung ke seller |

### 2.1 Kredensial Akun Bawaan (Uji Coba)
Daftar akun pengujian disimpan terpisah dalam [AKUN_DEMO.md](file:///d:/ekraf/shangyun/AKUN_DEMO.md):
- **Admin**: `admin@shangyun.id` (PW: `admin123`)
- **Seller**: `seller@shangyun.id` (PW: `seller123`)
- **Pembeli**: `pembeli@shangyun.id` (PW: `pembeli123`)

Akun tidak lagi diekspos di UI publik login demi menjaga standar keamanan.

---

## 3. Database & Skema PostgreSQL (Neon)

Aplikasi terintegrasi dengan serverless PostgreSQL dari **Neon** (`@neondatabase/serverless`).
Secara bawaan berjalan dalam **mode dummy terkelola** (in-memory / local storage sync) sehingga siap dijalankan langsung tanpa memerlukan koneksi cloud seketika. Apabila `DATABASE_URL` diisi pada `.env`, sistem langsung beralih ke koneksi live Neon PostgreSQL.

### 3.1 Skema Tabel (DDL)

#### Tabel `sellers`
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | VARCHAR(50) PRIMARY KEY | Identitas unik seller (contoh: `s1`, `s2`) |
| `nama` | VARCHAR(100) NOT NULL | Nama lengkap pengrajin |
| `email` | VARCHAR(100) UNIQUE | Email kontak |
| `nama_toko` | VARCHAR(100) NOT NULL | Nama atelier / gerai kerajinan |
| `no_wa` | VARCHAR(20) NOT NULL | Nomor WhatsApp pemesanan (format internasional `62...`) |
| `spesialisasi` | VARCHAR(50) | Bidang kerajinan (contoh: Sulam Sutra, Lakur, Keramik) |
| `status` | VARCHAR(20) DEFAULT 'active' | Status keaktifan seller |
| `created_at` | TIMESTAMPTZ | Waktu pendaftaran |

#### Tabel `products`
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | VARCHAR(50) PRIMARY KEY | Kode unik produk (contoh: `p1`, `p2`) |
| `seller_id` | VARCHAR(50) REFERENCES sellers(id) | Relasi ke seller pemilik produk |
| `nama` | VARCHAR(120) NOT NULL | Nama karya kerajinan |
| `kategori` | VARCHAR(50) NOT NULL | Kategori (Dekorasi, Angpao, Hampers, Aksesori, dll.) |
| `harga` | NUMERIC(15, 2) NOT NULL | Nilai harga dalam Rupiah (CHECK >= 0) |
| `stok` | INTEGER NOT NULL | Jumlah unit tersedia (CHECK >= 0) |
| `deskripsi` | TEXT | Filosofi dan deskripsi bahan |
| `image_url` | TEXT | URL gambar di Cloudinary CDN atau data URI fallback |
| `unggulan` | BOOLEAN DEFAULT FALSE | Penanda produk unggulan (stempel 珍) |
| `created_at` | TIMESTAMPTZ | Waktu penambahan |

#### Tabel `users`
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | VARCHAR(50) PRIMARY KEY | Identitas user (contoh: `u_admin`, `u_seller1`) |
| `username` | VARCHAR(50) UNIQUE | Nama login demo |
| `role` | VARCHAR(20) CHECK ('admin', 'seller', 'pembeli') | Peran aktif |
| `seller_id` | VARCHAR(50) REFERENCES sellers(id) | Terisi jika role = seller |

---

## 4. Penyimpanan Gambar (Cloudinary Image Storage)

- **Layanan CDN**: [Cloudinary](https://cloudinary.com/) digunakan sebagai media storage eksternal untuk menyimpan foto produk beresolusi tinggi.
- **Mekanisme Upload**: Menggunakan direct unsigned upload endpoint (`https://api.cloudinary.com/v1_1/<cloud_name>/image/upload`) dengan upload preset.
- **Fallback**: Jika Cloudinary belum dikonfigurasi, sistem otomatis menggunakan canvas kompresi data URI lokal sehingga upload tetap berjalan lancar saat latihan/demo.
- **Konfigurasi Fleksibel**: Parameter `PUBLIC_CLOUDINARY_CLOUD_NAME` dan `PUBLIC_CLOUDINARY_UPLOAD_PRESET` dapat diatur melalui `.env` atau langsung diubah secara dinamis melalui panel Dashboard Admin.

---

## 5. Infrastruktur Deployment (Cloudflare Pages)

- **Platform**: Cloudflare Pages.
- **Adapter**: Menggunakan `@astrojs/cloudflare` adapter resmi.
- **Konfigurasi**: Terdefinisi pada [wrangler.json](file:///d:/ekraf/shangyun/wrangler.json) dan [astro.config.mjs](file:///d:/ekraf/shangyun/astro.config.mjs).
- **Proses Build**: Perintah `pnpm build` menghasilkan artefak teroptimasi di direktori `dist/` yang didistribusikan ke 300+ data center global Cloudflare dengan kecepatan akses instan dan proteksi DDoS bawaan.

---

## 6. Alur Kerja Fitur (User Stories)

### 6.1 Alur Pembeli (Customer Flow)
1. Pembeli membuka etalase web Shang Yun.
2. Melihat karya terkurasi dengan nama atelier seller pengrajinnya dan gambar CDN Cloudinary.
3. Mencari produk lewat kolom pencarian atau filter kategori/seller.
4. Mengklik tombol **"Pesan via WhatsApp"**: Pesan WhatsApp otomatis ditujukan ke nomor WhatsApp seller pembuat produk tersebut (`wa.me/<no_wa_seller>?text=...`).
5. Jika stok produk habis (0), tombol otomatis nonaktif (*aria-disabled*).

### 6.2 Alur Seller (Pengrajin Flow)
1. Seller beralih ke portal **Seller**.
2. Seller mengunggah karya baru via tombol **"Upload Karya Baru"**: mengisi nama, kategori, harga, stok, deskripsi, dan mengunggah foto ke Cloudinary.
3. Produk yang diunggah otomatis terikat dengan `seller_id` pengrajin tersebut.
4. Seller dapat mengubah nomor WhatsApp tokonya sendiri di panel pengaturan kontak.
5. Seller dapat mengedit harga/stok atau menghapus produk miliknya.

### 6.3 Alur Admin (Platform Manager Flow)
1. Admin beralih ke portal **Admin**.
2. Admin dapat menambahkan seller baru via modal **"Tambah Seller Baru"** (Nama, Toko, No WhatsApp, Spesialisasi).
3. Admin dapat mengatur konfigurasi Cloudinary (Cloud Name & Upload Preset).
4. Admin memantau metrik agregat: Total Seller Aktif, Total Produk Terdaftar, Total Unit Stok Fisik, dan Total Nilai Inventaris Platform.
5. Admin memiliki wewenang meninjau dan mengawasi seluruh produk dari seluruh seller.

---

## 7. Acceptance Criteria (Pemeriksaan Manual)

- [ ] **AC-Role-1**: Pengguna dapat beralih antara peran **Pembeli**, **Seller**, dan **Admin** secara instan.
- [ ] **AC-Role-2 (Pembeli)**: Pembeli hanya dapat melihat katalog dan memesan via WhatsApp (tidak memiliki akses tombol tambah/edit produk).
- [ ] **AC-Role-3 (Seller)**: Seller dapat mengunggah produk baru; foto terunggah ke Cloudinary; produk tersimpan dengan `seller_id` yang sesuai; tombol WhatsApp produk mengarah ke nomor seller tersebut.
- [ ] **AC-Role-4 (Admin)**: Admin dapat mendaftarkan seller baru; seller baru langsung muncul di daftar seller dan dapat dipilih saat upload produk.
- [ ] **AC-Cld-1**: Upload gambar bekerja langsung ke Cloudinary bila preset aktif; fallback data URI bekerja mulus bila belum dikonfigurasi.
- [ ] **AC-Deploy-1**: Proyek berhasil dibuild dengan adapter Cloudflare (`astro build`) dan siap dideploy via `npx wrangler pages deploy dist`.
