# 🔐 Daftar Akun & Kredensial Bawaan (Shang Yun 尚韵)

Dokumen ini berisi daftar akun bawaan (dummy / demo) untuk pengujian sistem autentikasi dan manajemen hak akses di platform **Shang Yun 尚韵**. 

> [!IMPORTANT]
> Seluruh tombol dan informasi akun dummy telah dihapus dari antarmuka login publik (*frontend*) agar aman dan tidak dapat dilihat oleh publik/pengunjung biasa. Gunakan kredensial di bawah ini secara manual saat ingin masuk ke peran terkait.

---

## 1. Tabel Kredensial Akun

| Peran | Email / ID Akun | Kata Sandi | Nama Profil | Hak Akses Utama |
| :--- | :--- | :--- | :--- | :--- |
| **👑 Admin** | `admin@shangyun.id` | `admin123` | Administrator Platform | Khusus pengawasan direktori mitra gerai kriya resmi (Daftar Seller) & pendaftaran gerai baru. Tidak memuat formulir upload katalog seller atau pengaturan nomor seller. |
| **🏮 Seller (Pengrajin)** | `seller@shangyun.id` | `seller123` | Master Chen Zhao (Zhao Atelier Suzhou) | Manajemen karya gerai sendiri, menu **Pesanan Masuk** terisolasi khusus gerai ini (status konfirmasi, hubungi pembeli via WhatsApp, update status proses/selesai), upload foto karya, edit stok, dan nomor WhatsApp resmi gerai. |
| **🛍️ Pembeli (Buyer)** | `pembeli@shangyun.id` | `pembeli123` | Pembeli Terhormat | Jelajah katalog kriya Imlek, filter gerai, keranjang pesanan dengan pemisahan per gerai pengrajin, pemesanan langsung via WhatsApp gerai bersangkutan. |

---

## 2. Pendaftaran Akun Baru (Dengan Verifikasi OTP)

Pengguna juga dapat membuat akun baru mandiri secara aman melalui tab **Daftar Akun (Register)** di antarmuka web:

1. **Daftar sebagai Pembeli**:
   * Masukkan Nama Lengkap, Email aktif, dan Kata Sandi (minimal 8 karakter).
   * Masukkan **Kode OTP 6-Digit** yang dikirimkan (dalam mode simulasi, kode OTP demo ditampilkan pada layar verifikasi OTP).
   * Akun otomatis terdaftar sebagai role **Pembeli** dan langsung login.

2. **Daftar sebagai Seller (Pengrajin Baru)**:
   * Masukkan Nama Pengrajin, Nama Toko / Atelier Kerajinan, Spesialisasi Kriya, Email, Nomor WhatsApp Pemesanan Toko, dan Kata Sandi.
   * Masukkan kode verifikasi OTP 6-digit.
   * Akun otomatis terdaftar sebagai role **Seller**, toko baru ditambahkan ke database, dan nomor WhatsApp toko langsung terhubung ke tombol pemesanan katalog.

---

## 3. Catatan Keamanan
* File ini tersimpan secara lokal di lingkungan repositori proyek (`d:\ekraf\shangyun\AKUN_DEMO.md`).
* Form login di website kini bersih dan tidak menampilkan kredensial akun bawaan secara publik.

