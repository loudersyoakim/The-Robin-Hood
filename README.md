# The Robin Hood Leaderboard

Website leaderboard statis (HTML/CSS/JS murni), siap di-host di **GitHub Pages**, dengan tema parchment hijau + emas seperti gambar referensi.

Ada 2 halaman:
- **`index.html`** — leaderboard publik: Rank, The Hood (kode inisial), IDR, Total Keseluruhan. Otomatis terurut dari terbesar, dan nilai di bawah Rp 500.000 otomatis tampil `< Rp 500.000`.
- **`admin.html`** — halaman kelola data, dilindungi password. Di sini kamu bisa tambah, ubah, atau hapus peserta langsung dari form, dari HP mana pun, tanpa buka Google Sheets dan tanpa sentuh kode sama sekali.

Datanya tetap disimpan di Google Sheet (sebagai arsip/cadangan yang bisa kamu lihat kapan saja), tapi kamu **tidak perlu membukanya** — cukup lewat `admin.html`.

---

## 1. Siapkan Google Sheet + backend (sekali saja)

1. Buka [sheets.google.com](https://sheets.google.com) → buat spreadsheet baru, misal beri nama **"Robin Hood Data"**.
2. Buat 3 kolom di baris pertama, sheet pertama harus bernama **Sheet1** (nama default, biasanya sudah otomatis):

   | Nama | Kode | Jumlah |
   |------|------|--------|

   - **Nama** — nama lengkap (untuk catatan, tidak wajib tampil di web).
   - **Kode** — 2 huruf inisial yang tampil di kolom "The Hood".
   - **Jumlah** — profit dalam Rupiah, angka penuh tanpa titik/koma (contoh: `1500000`).

3. Salin isi file **`data.csv`** (di folder ini) sebagai data awal — paste ke sheet tersebut.
4. Di Google Sheet, buka menu **Extensions → Apps Script**.
5. Hapus semua kode default di editor yang terbuka, lalu **salin-tempel seluruh isi file `code.gs`** (ada di folder ini) ke sana.
6. Di baris paling atas kode itu, ganti:
   ```js
   const PASSWORD = "GANTI_PASSWORD_INI";
   ```
   dengan password pilihanmu sendiri — ini password yang nanti dipakai untuk masuk ke `admin.html`.
7. Klik **Deploy → New deployment**. Pilih tipe **Web app**, isi:
   - Execute as: **Me**
   - Who has access: **Anyone**
8. Klik **Deploy**, lalu **izinkan (authorize)** semua permission yang diminta Google (ini normal, karena scriptnya perlu akses ke sheet-mu sendiri).
9. Setelah deploy selesai, **salin "Web app URL"** yang muncul (bentuknya seperti `https://script.google.com/macros/s/xxxxx/exec`).

## 2. Sambungkan URL itu ke website

1. Buka file **`config.js`**.
2. Tempel URL dari langkah 9 di atas:
   ```js
   const APPS_SCRIPT_URL = "https://script.google.com/macros/s/xxxxx/exec";
   ```
3. Simpan file.

Ini satu-satunya kali kamu perlu menyentuh kode. Setelah ini, semua update cukup lewat halaman `admin.html`.

## 3. Upload ke GitHub & aktifkan GitHub Pages

1. Buat repository baru di GitHub (harus **public** untuk GitHub Pages gratis).
2. Upload semua file di folder ini (`index.html`, `admin.html`, `style.css`, `admin.css`, `script.js`, `admin.js`, `config.js`, `data.csv`). File `code.gs` **tidak perlu** diupload — itu sudah "hidup" di dalam Google Apps Script, cukup disimpan sebagai referensi.
3. Buka **Settings → Pages**, pilih branch `main` dan folder `/ (root)`, lalu **Save**.
4. Tunggu 1–2 menit, GitHub memberi link seperti `https://username.github.io/nama-repo/` — itu leaderboard kamu, dan `https://username.github.io/nama-repo/admin.html` adalah halaman kelola datanya.

## 4. Cara update data setiap hari (dari HP, tanpa kode, tanpa Google Sheets)

1. Buka `admin.html` di browser HP kamu (bisa disimpan sebagai shortcut/bookmark).
2. Masukkan password yang kamu set di langkah 1.6. Centang **"Ingat di perangkat ini"** supaya tidak perlu login ulang tiap kali.
3. Di tabel yang muncul: ubah angka **Jumlah**, ubah **Kode**, klik **✕** untuk hapus peserta, atau **+ Tambah Peserta** untuk yang baru.
4. Klik **Simpan Perubahan**. Selesai — leaderboard langsung ter-update saat halaman `index.html` dibuka lagi.

> Data tetap otomatis tersimpan ke Google Sheet-mu (sebagai arsip), tapi kamu tidak perlu pernah membukanya.

---

## Struktur file

```
index.html    → halaman leaderboard publik
admin.html    → halaman kelola data (password)
style.css     → tampilan utama (frame kayu, panel hijau, emas)
admin.css     → tampilan tambahan khusus halaman admin
script.js     → ambil data & render leaderboard
admin.js      → login, edit, simpan data lewat backend
config.js     → tempat mengisi APPS_SCRIPT_URL
code.gs       → kode backend, ditempel ke Google Apps Script (bukan diupload ke GitHub)
data.csv      → data cadangan/contoh (dipakai kalau APPS_SCRIPT_URL belum diisi)
```

## Kustomisasi lanjutan

- **Ganti nama brand/judul**: edit teks di `index.html` bagian `<div class="brand">` dan `<h1 class="title">`.
- **Ganti ambang batas "< Rp 500.000"**: ubah `LOW_VALUE_THRESHOLD` di `script.js`.
- **Ganti warna**: semua warna diatur lewat variabel di bagian atas `style.css` (`:root { ... }`).
- **Ganti password**: edit `PASSWORD` di `code.gs`, lalu Deploy ulang (Deploy → Manage deployments → Edit → New version).

## Catatan keamanan

Password di `admin.html` diperiksa oleh backend Apps Script, bukan hanya di browser, jadi cukup aman untuk pemakaian internal tim kecil. Tapi karena URL `admin.html` bisa dibuka siapa saja yang tahu link-nya, jangan sebarkan link tersebut secara luas, dan pilih password yang tidak mudah ditebak.
