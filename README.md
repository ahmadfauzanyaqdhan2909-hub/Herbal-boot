# Herbal Boot 🌿

Aplikasi Chatbot cerdas berbasis AI (Google Gemini) yang bertindak sebagai Pakar Resep Herbal. Chatbot ini dapat merekomendasikan resep pengobatan herbal berdasarkan studi ilmiah dan jurnal medis, lengkap dengan fitur antarmuka interaktif.

## Fitur Utama
- 🤖 **Respons Terstruktur (Pakar Herbal)**: Bot diinstruksikan secara ketat untuk menjawab menggunakan format **Tabel** (Jurnal Terpercaya, Detail Bahan, Cara Membuat, Best Practice, Dosis) beserta peringatan disklaimer medis.
- 📚 **Mode Koleksi Interaktif**: Anda bisa menyimpan resep dari obrolan ke dalam etalase Koleksi. Koleksi ini mendukung fitur *Collapse/Expand*, Edit Judul, pengaturan urutan (*Drag & Drop*), dan penghapusan.
- 🔍 **Telusuri Percakapan**: Cari riwayat obrolan lama secara instan melalui kolom pencarian *real-time*.
- 💾 **Local Storage**: Semua riwayat obrolan dan koleksi tersimpan dengan aman di dalam *browser* Anda.

---

## Cara Menjalankan Aplikasi

Karena aplikasi ini menggunakan kecerdasan buatan dari Google (Gemini), setiap orang yang mengkloning (mengunduh) kode ini harus memasukkan kunci rahasia (API Key) milik mereka sendiri agar aplikasi dapat berjalan.

### 1. Persiapan Sistem
Pastikan komputer Anda sudah terinstal:
- [Node.js](https://nodejs.org/) (Versi 18 atau lebih baru).
- [Git](https://git-scm.com/).

### 2. Kloning dan Instalasi
Buka terminal/CMD Anda dan jalankan perintah berurutan berikut:
```bash
git clone https://github.com/ahmadfauzanyaqdhan2909-hub/Herbal-boot.git
cd Herbal-boot
npm install
```

### 3. Konfigurasi Rahasia (API Key)
Untuk keamanan, file yang memuat kunci API tidak disertakan di GitHub. Anda harus membuatnya sendiri:
1. Dapatkan **Gemini API Key** Anda secara gratis melalui [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Buat sebuah file baru bernama `.env` di dalam folder utama proyek ini.
3. Buka file `.env` tersebut dan masukkan kode berikut (ganti dengan kunci asli Anda):
   ```env
   GEMINI_API_KEY=masukkan_api_key_anda_di_sini
   ```

### 4. Menjalankan Server
Setelah API Key diatur, jalankan server *backend* dengan perintah:
```bash
node index.js
```

### 5. Mulai Menggunakan
Buka browser (Chrome/Edge/Safari) dan kunjungi alamat berikut:
**`http://localhost:8080`**

Aplikasi Chatbot Herbal siap melayani Anda!
