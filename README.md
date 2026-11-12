# Cermin Wastra · BUDAYA GO! 2026

> Turunan dari VirtualFit, dikhususkan untuk lomba BUDAYA GO! 2026 (Inovasi Digital). Isi di bawah masih dokumentasi VirtualFit dan akan diperbarui.

Website cermin AI: nyalakan kamera, seret baju ke badan, dan AI (Decart **Lucy VTON**) menggambar ulang video kamu memakai baju itu secara live. Baju bisa diambil dari Tokopedia, Shopee, atau toko online mana pun.

## Yang dibutuhkan
- **Node.js 18+** — https://nodejs.org
- **API key Decart** — daftar di https://platform.decart.ai (akun baru dapat kredit gratis untuk mencoba)
- Chrome / Edge terbaru, webcam, internet stabil

## Menjalankan (pertama kali)
```bash
npm install
```
Salin `.env.example` menjadi `.env`, lalu isi:
```
DECART_API_KEY=dct_xxxxxxxxxxxxxxxx
```
Jalankan:
```bash
npm run dev
```
Browser terbuka otomatis di **http://localhost:3210**.

## Cara pakai
1. Klik **Nyalakan cermin** dan izinkan kamera.
2. **Seret** baju dari katalog ke kamera (atau klik bajunya).
3. **Impor baju dari toko online:**
   - Tempel link produk Tokopedia/Shopee atau link gambarnya di kolom *Impor*, atau
   - Buka produknya di tab lain, lalu **seret foto bajunya** langsung ke kotak kamera, atau
   - Salin gambar (klik kanan > Salin gambar) lalu tekan **Ctrl+V** di halaman ini, atau upload file.
4. Pilih jenisnya (Atasan / Outer / Topi). Isi deskripsi dalam bahasa Inggris kalau mau hasil lebih mirip, misalnya `black denim jacket with silver buttons`.
5. Klik **■ Stop** kalau sudah selesai, supaya kredit tidak terus terpakai.

## Biaya
Decart menagih **per detik** selama cermin menyala: sekitar **$0.02/detik ≈ $1.20/menit** (mode standar 720p, harga per dokumentasi Decart). Pojok kanan bawah menampilkan perkiraan biaya. Cermin mati otomatis 20 detik setelah tab ditinggal.

## Tips hasil terbaik
- Foto **baju saja** (tanpa model), tampak depan, latar putih/polos, minimal 512px.
  Foto produk yang dipakai model masih bisa jalan, tapi kurang akurat.
- Lepas jaket tebal dulu, berdiri dengan cahaya terang, badan atas terlihat.
- Untuk jaket/blazer, centang "Dipakai terbuka" kalau ingin tampak terbuka.

## Masalah umum
| Pesan | Solusi |
|---|---|
| `DECART_API_KEY belum diisi` | Buat file `.env` seperti di atas, lalu jalankan ulang `npm run dev` |
| `Kredit Decart habis` | Isi saldo di platform.decart.ai |
| `Situs menolak permintaan` saat impor link | Toko memblokir. Pakai cara seret gambar / Ctrl+V / upload |
| Kamera hitam | Tutup aplikasi lain yang memakai kamera (Zoom, OBS, dll) |

## Dashboard admin (`/admin`)
Kelola beberapa API key Decart, pantau sisa kredit, dan biarkan cermin pindah key otomatis saat kredit habis.

1. Siapkan login (sekali saja). Username & password ditanyakan di terminal; password disimpan sebagai hash scrypt di `.env`:
   ```bash
   npm run admin:setup
   ```
2. Jalankan ulang `npm run dev`, buka **http://localhost:3210/admin**.
3. Key di `DECART_API_KEY` otomatis masuk daftar. Tambah key lain lewat **+ Tambah key**.

Cara kerja:
- Key dipakai **berurutan dari atas**. Saat membuat token, key yang kreditnya < 10, ditolak Decart, atau nonaktif dilewati.
- Kalau Decart menghentikan sesi karena `insufficient_credits`, key ditandai habis dan cermin langsung menyambung ulang memakai key berikutnya (maks. 3x per menit).
- Saldo diambil dari `GET /v1/credits` milik Decart. Key yang diisi ulang aktif lagi otomatis saat saldonya dicek.
- API key disimpan terenkripsi (AES-256-GCM, kunci dari `ADMIN_SECRET`) di `data/keys.json`. **Jangan ganti `ADMIN_SECRET`** setelah ada key tersimpan, karena key lama tidak akan bisa dibuka.
- Lokasi folder data bisa diubah dengan `VIRTUALFIT_DATA_DIR`.

| Variabel `.env` | Isi |
|---|---|
| `DECART_API_KEY` | Key awal (diimpor otomatis ke dashboard) |
| `ADMIN_USERNAME` | Username admin (diisi `admin:setup`) |
| `ADMIN_PASSWORD_HASH` | Hash scrypt password (diisi `admin:setup`) |
| `ADMIN_SECRET` | Kunci enkripsi & tanda tangan sesi (dibuat otomatis) |
| `VIRTUALFIT_DATA_DIR` | Opsional, lokasi `keys.json` |

## Jatah coba gratis (tamu tanpa login)
Supaya kredit Decart tidak habis dipakai pengunjung, cermin di situs publik dibatasi. Batas dihitung dan dipaksa **di server**, bukan di browser:

| Lapis | Aturan bawaan | Variabel |
|---|---|---|
| Per tamu (cookie bertanda tangan) | 2 percobaan | `TRIAL_GUEST_TRIES` |
| Durasi per percobaan (dikunci Decart di dalam token) | 20 detik | `TRIAL_SECONDS` (min. 10) |
| Per IP per hari (menahan yang ganti browser atau menghapus cookie) | **Sama dengan jatah tamu (2)** | `TRIAL_IP_DAILY_TRIES` |
| Plafon harian semua pengunjung (pengaman utama) | 300 detik (≈ 600 kredit ≈ $6) | `TRIAL_DAILY_BUDGET_SECONDS` |
| Masa tenggang token ulang = percobaan yang sama | 15 detik | `TRIAL_GRACE_SECONDS` |

- Aktif otomatis di Vercel. Lokal mati; nyalakan dengan `TRIAL_ENABLED=1` (matikan di Vercel dengan `TRIAL_ENABLED=0`).
- Hari dihitung dengan zona waktu WIB (UTC+7). Jatah per tamu berlaku seumur cookie.
- Admin yang sudah login ke `/admin` tidak kena batas. Pemakaian hari ini tampil di dashboard admin.
- Token tamu berumur 45 detik dan hanya boleh dipakai untuk model `lucy-vton-3.6` / `3.5`.
- Plafon harian dihitung dengan asumsi terburuk (tiap token dianggap terpakai penuh), jadi angkanya cenderung lebih besar dari pemakaian sebenarnya.
- Batas per IP dihitung per alamat: ganti browser di jaringan yang sama **tidak** menambah jatah. IPv6 dikelompokkan per /64 (satu perangkat memakai banyak alamat sementara), dan `::ffff:1.2.3.4` dianggap IPv4 yang sama.
- Konsekuensinya, orang di **jaringan yang sama berbagi jatah IP** (kantor, kampus, lokasi penjurian, sebagian paket seluler). Naikkan `TRIAL_IP_DAILY_TRIES` untuk hari penjurian.
- Batas tanpa login **tidak bisa dibuat kedap**: **VPN atau pindah jaringan memberi IP baru, dan browser baru tidak punya cookie lama**, jadi jatah baru. Yang benar-benar menutupnya cuma akun (login). Kerugian terburuknya dibatasi oleh plafon harian.

## Struktur
- `server/`: endpoint `/api/*` (token, laporan pemakaian, proxy gambar, admin). Dipasang ke dev server lewat `vite.config.js`, ditulis sebagai middleware Node biasa supaya bisa dipindah ke server produksi.
- `admin/`: halaman dashboard `/admin`.
- `src/main.js`: kamera, koneksi Decart realtime, katalog, seret & impor, ganti key otomatis. `src/hero-carousel.js`: carousel 3D di hero.
- `public/garments/unsplash/`: foto katalog (sumber di `CREDITS.md`).
- `scripts/admin-setup.mjs`: menyiapkan login admin.
