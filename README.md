# Shang Yun (尚韵) — Imperial Lunar New Year Luxury Crafts

Aplikasi web modern katalog pusaka dan dashboard pengelolaan produk UMKM kerajinan tangan / cenderamata mewah Tahun Baru Imlek (*Chinese New Year*).

## 🚀 Tech Stack
- **Framework**: [Astro 5](https://astro.build/) (Static Site Generation & Islands Architecture)
- **Front-end UI**: [Svelte 5](https://svelte.dev/) (Reactive UI Components & State Management)
- **3D Visuals**: [Three.js](https://threejs.org/) (Interactive Golden Particles & Celestial Torus Ambient Scene)
- **Motion & Interactions**: [GSAP](https://greensock.com/gsap/) (Staggered Card Reveals & Luxury Shimmer Effects)
- **Storage**: Browser `localStorage` (Persistensi lokal tanpa ketergantungan backend server)
- **Package Manager**: [pnpm](https://pnpm.io/)

---

## 📁 Struktur Direktori
```
shangyun/
├── astro.config.mjs          # Konfigurasi Astro + @astrojs/svelte
├── package.json              # Dependensi Astro, Svelte, Three.js, GSAP
├── jsconfig.json             # Path alias & konfigurasi IDE
├── src/
│   ├── components/
│   │   ├── ThreeCanvas.svelte # 3D Ambient Scene (Partikel Emas & Ring Tiga Dimensi)
│   │   └── CatalogApp.svelte  # Komponen Utama Svelte (Etalase, Filter, Modal, CRUD)
│   ├── data/
│   │   └── products.js        # 8 Data Awal Pusaka & Preset Ilustrasi Vektor SVG
│   ├── layouts/
│   │   └── Layout.astro       # Shell HTML, Meta tags, & Font Imperial Google Fonts
│   ├── pages/
│   │   └── index.astro        # Entry point halaman utama Astro
│   └── styles/
│       └── global.css         # Design tokens tema Imperial CNY (Crimson, Gold, Jade)
```

---

## 🛠️ Cara Menjalankan

### 1. Masuk ke direktori projek
```bash
cd d:\ekraf\shangyun
```

### 2. Jalankan Dev Server
```bash
pnpm dev
```
Buka browser pada alamat yang muncul di terminal (biasanya `http://localhost:4321`).

### 3. Build untuk Produksi
```bash
pnpm build
pnpm preview
```

---

## 🌟 Fitur Utama
1. **Etalase Katalog Pembeli**:
   - 8 karya pusaka Imlek dengan gambar SVG vektor mandiri (bebas hak cipta).
   - Pencarian teks langsung (*live search*).
   - Filter kategori dengan penghitung produk otomatis.
   - Filter khusus koleksi unggulan (*Imperial Pick*).
   - Pengurutan multi-kriteria (Unggulan, Harga Min/Max, Nama A-Z, Stok).
   - Modal detail mahakarya.
   - Tombol reservasi WhatsApp otomatis (*concierge link*).
2. **Dashboard Pengelola Toko**:
   - Ringkasan metrik inventaris (Total Karya, Total Stok, Total Kategori, Koleksi Unggulan, Total Nilai Inventaris Rp).
   - Tabel data inventaris dengan pencarian cepat.
   - Operasi CRUD penuh (Tambah karya baru, Edit data, Hapus aman).
   - Pemilih preset ilustrasi SVG atau URL gambar kustom.
   - Tombol *"Reset Data Bawaan"* untuk mengembalikan 8 karya default.
   - Persistensi otomatis ke `localStorage`.
3. **Efek Visual Tiga Dimensi & Animasi**:
   - Kanvas Three.js di latar belakang merespons pergerakan kursor mouse.
   - Animasi transisi kartu dan kilau emas menggunakan GSAP.

# shangyun-ekraf
