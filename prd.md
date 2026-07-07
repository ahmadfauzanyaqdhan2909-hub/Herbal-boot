# Product Requirements Document (PRD)
## Gemini AI Chatbot Architecture

### 1. Tujuan
Membangun sebuah aplikasi web chatbot interaktif yang menghubungkan antarmuka pengguna di peramban dengan model AI Gemini melalui server perantara Node.js/Express.

### 2. Arsitektur Sistem (Berdasarkan Diagram Sekuensial)
Sistem terdiri dari 3 lapisan utama:
- **Frontend (Browser):** Antarmuka klien (Vanilla HTML/CSS/JS) untuk berinteraksi dengan pengguna.
- **Backend (Node.js + Express):** Server API perantara yang menangani *request* dari frontend dan berkomunikasi dengan AI.
- **Gemini AI Model:** Model kecerdasan buatan yang bertugas menghasilkan respons percakapan.

### 3. Alur Komunikasi Utama
1. **User Input:** Pengguna mengetik pesan (Type a message) di antarmuka web.
2. **Client Request:** Frontend mengirimkan HTTP POST /api/chat dengan payload pesan pengguna ke Backend.
3. **Server Request:** Backend menerima pesan dan memanggil metode generateContent(message) ke model Gemini AI.
4. **AI Response:** Gemini AI mengembalikan respons berbasis teks (*AI-generated response*).
5. **Server Response:** Backend membungkus respons AI ke dalam struktur format JSON { "reply": "response" } dan merespons Frontend.
6. **UI Update:** Frontend mem-parsing JSON dan menampilkannya sebagai balasan chatbot di layar peramban (Display chatbot reply).

### 4. Persyaratan Teknis
- Endpoint backend tunggal untuk pengolahan pesan: POST /api/chat.
- Payload body dan respons harus menggunakan standar komunikasi tipe data JSON.
