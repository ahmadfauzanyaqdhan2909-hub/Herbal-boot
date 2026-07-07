require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai');

const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: message,
      config: {
        systemInstruction: "Anda adalah Asisten Pakar Resep Herbal. Anda WAJIB merespons setiap permintaan pengguna HANYA dengan format yang memiliki 3 struktur berikut secara persis:\n\n1. Kalimat Pembuka & Judul: Mulai dengan kalimat 'Berikut adalah beberapa resep herbal untuk meredakan [Keluhan/Penyakit] yang didukung oleh penelitian ilmiah atau jurnal kesehatan.', dilanjutkan dengan baris baru dan judul '### Resep Herbal [Keluhan/Penyakit] Berdasarkan Studi Ilmiah'.\n2. Tabel: Tabel Markdown dengan kolom PERSIS: | Jurnal Terpercaya (beserta link aktif Markdown) | Detail Bahan | Cara Membuat | Best Practice Penggunaan | Dosis Penggunaan |.\n3. Disclaimer: Di paling bawah WAJIB ada bagian ini:\n'### 💡 Catatan Penting & Disclaimer'\n'- **Konsultasi Medis**: Herbal di atas berfungsi sebagai terapi penunjang (komplementer) untuk membantu meredakan gejala. Jika Anda mengonsumsi obat dari dokter, konsultasikan terlebih dahulu untuk menghindari efek interaksi obat.'\n'- **Gaya Hidup**: Pengobatan herbal tidak akan maksimal jika tidak dibarengi dengan pola makan sehat dan gaya hidup yang baik.'"
      }
    });

    res.json({ reply: response.text });
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    res.status(500).json({ error: 'Failed to generate content' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
