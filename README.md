# GetAbsen — Sistem Manajemen & Otomatisasi Absensi Intern

![GetAbsen Banner](client/public/vite.svg)

GetAbsen adalah sistem manajemen absensi dan logbook harian berbasis web modern yang dibuat khusus untuk anak magang (Intern) dan Mentor di Getcore.ID. Aplikasi ini mengusung tampilan **Claymorphism UI** yang interaktif dan menyenangkan (*playful*), dirancang khusus untuk mempermudah pelacakan masa magang, laporan tugas, hingga pemantauan progres.

## 🌟 Fitur Utama

### Untuk Intern (Anak Magang)
*   **Absensi:** Sistem _clock-in/out_ yang mudah dengan pelacakan lokasi dan status.
*   **Logbook:** Pencatatan aktivitas harian secara terstruktur (Kualitatif & Kuantitatif) beserta *evidence* foto.
*   **Planner:** Kalender pribadi untuk menyusun jadwal dan agenda tugas.
*   **Export Data:** Kemampuan men-*download* logbook aktivitas harian ke dalam format laporan PDF yang rapi.

### Untuk Mentor & Admin
*   **Dashboard:** Tinjauan metrik tingkat tinggi mengenai jumlah intern, tingkat kehadiran, dan statistik kinerja.
*   **Progress Intern:** Tampilan mendetail terhadap kinerja per individu, riwayat absen, logbook harian lengkap, dan fitur export laporan PDF.
*   **AI Chat (Mendatang):** Asisten AI pintar yang berguna untuk membantu mentor dalam menganalisis kinerja intern.

---

## 🛠️ Stack Teknologi (Tech Stack)

**Frontend (Client)**
*   React 18 + Vite
*   Tailwind CSS v4 (Dengan styling kustom Claymorphism/3D)
*   Lucide React (Ikon)
*   jsPDF & jsPDF-AutoTable (Pembuatan PDF Laporan)
*   *Font: Plus Jakarta Sans*

**Backend (Server)**
*   Node.js & Express.js
*   Prisma ORM (Database PostgreSQL via Neon Serverless)
*   JSON Web Tokens (JWT) untuk Autentikasi keamanan
*   Multer (Fitur Upload File)

---

## 🚀 Panduan Setup & Instalasi Lokal

### Prasyarat (*Prerequisites*)
*   Node.js (Disarankan versi v18 ke atas)
*   npm atau yarn
*   Database PostgreSQL (Contoh: Neon.tech / Supabase / Lokal)

### 1. Clone Repositori
\`\`\`bash
git clone <repository-url>
cd getabsen
\`\`\`

### 2. Setup Bagian Backend (Server)
\`\`\`bash
cd server

# Install dependensi utama backend
npm install express cors dotenv jsonwebtoken bcryptjs multer pg
npm install @prisma/client

# Install dependensi development backend
npm install -D nodemon prisma

# Konfigurasi Environment Variable
cp .env.example .env
# Edit file .env dan masukkan DATABASE_URL (contoh Neon Tech) & JWT_SECRET milikmu.

# Jalankan migrasi Prisma ke Database
npx prisma migrate dev --name init

# Jalankan server API backend (berjalan di port 3000)
npm run dev
\`\`\`

### 3. Setup Bagian Frontend (Client)
\`\`\`bash
# Buka terminal/cmd baru
cd client

# Install dependensi utama frontend React
npm install react react-dom react-router-dom lucide-react jspdf jspdf-autotable axios

# Install dependensi development & styling
npm install -D vite tailwindcss @tailwindcss/vite eslint

# Jalankan server frontend Vite
npm run dev
\`\`\`
Aplikasi web kini bisa diakses melalui browser di alamat `http://localhost:5173`.

---

## 🤖 Catatan Khusus untuk AI Engineer (Panduan Integrasi AI)

Bagian ini merangkum panduan tentang bagaimana Model Bahasa (LLM) dan AI Agent bisa diintegrasikan dengan mulus ke dalam platform GetAbsen untuk memperkuat analisis kinerja.

### 1. Kesiapan Infrastruktur AI
*   **Database Prisma:** Skema database sudah secara jelas memisahkan `User` (Role `INTERN`, `MENTOR`, `ADMIN`), `Attendance` (Kehadiran), dan `LogbookEntry` (Laporan harian).
*   **Struktur API:** Struktur routing backend di `server/src/routes` berbentuk modular. *Endpoint* khusus AI yang baru bisa kamu tambahkan misalnya di `ai.routes.js` atau `analytics.routes.js`.
*   **Frontend UI:** Sudah disiapkan halaman kerangka dasar untuk fitur chat AI di direktori `client/src/pages/mentor/AiChat.jsx`.

### 2. Peluang Utama Integrasi AI Berdampak Tinggi

**A. Analisis Sentimen & Kualitas Logbook (Otomatis)**
*   **Tujuan:** Mengevaluasi teks pada input `kualitatif` dan `kuantitatif` di tabel `LogbookEntry`.
*   **Cara:** Pasang sebuah *background worker* / *CRON job* atau *trigger Webhook* setiap kali ada logbook baru yang disubmit (`POST /api/logbook`). Gunakan model LLM untuk melakukan automasi pengecekan: seberapa produktif magang ini hari ini? Apakah bahasanya positif? Apakah ada _blocker/masalah_ yang dilaporkan?.
*   **Lokasi:** Buat model baru di Prisma (Misal: `LogbookAnalysis`) yang membawa relasi langsung ke ID `LogbookEntry`.

**B. Kesimpulan (Summary) Evaluasi Mingguan Mentor**
*   **Tujuan:** Menghasilkan laporan mingguan kinerja intern menggunakan bahasa natural.
*   **Cara:** Buat *script* di backend yang akan memanggil data `LogbookEntry` dan `Attendance` 7 hari ke belakang milik intern tertentu. Susun dan berikan ke *Context Window* LLM prompt, lalu minta ia membuatkan rangkuman profesional.
*   **Lokasi:** Tampilkan rangkuman AI ini dalam halaman *Dashboard* Progress Intern (`InternProgress.jsx`) milik peran Mentor.

**C. Asisten "AI Chat" untuk Mentor (`AiChat.jsx`)**
*   **Tujuan:** Memudahkan Mentor bertanya seputar laporan ke asisten bot, seperti: *"Siapa intern yang akhir-akhir ini paling sering absen?"* atau *"Tolong rangkum dong tugas-tugas Budi selama 3 hari terakhir."*
*   **Cara:**
    *   Implementasikan arsitektur Retrieval-Augmented Generation (RAG).
    *   Buat struktur *Embeddings* untuk setiap deskripsi tugas/logbook intern dan simpan ke dalam Vector Database (Atau gunakan pgvector langsung via PostgreSQL Neon).
    *   Buat sebuah endpoint `/api/ai/chat` di Express.js yang secara reaktif menampung pertanyaan User Mentor, mengambil konteks database (Pencarian Vektor logbook/kehadiran), dan membangun jawaban menggunakan LLM.

### 3. Alur Implementasi Rekomendasi Fitur AI

1.  **Definisi Schema Database:** Tambahkan relasi/tabel baru pada file `schema.prisma` bila butuh wadah penyimpanan (contoh: tabel hasil *summary* AI, tabel *cache vector embedding*). Pastikan selalu menjalankan perintah `npx prisma db push` atau `prisma migrate`.
2.  **Logic API Node.js:** Buat *controller* Express.js baru yang secara khusus menangani logika AI. Kamu bisa pakai library standar seperti `langchain` atau SDK asli bawaan model (seperti SDK OpenAI, Anthropic, Gemini Node.js).
3.  **Sistem Keamanan:** Pastikan API AI selalu dijaga *middleware* otentikasi JWT default (`authenticateToken`). Cegah terjadinya kebocoran data dengan memastikan *AI prompt limitasi akses* sehingga seorang Mentor/Admin hanya bisa "menanyakan" data intern di bawah naungannya.
4.  **Integrasi Desain Frontend:** Saat ingin merender "AI Box Reccomendation" atau "Pesan AI Chat" di antarmuka, tetap gunakan komponen CSS *Claymorphism UI*! Gunakan `var(--shadow-clay)` yang sudah disiapkan di file `index.css` agar secara estetika tidak merusak kesan *playful* tema aplikasinya.

---
*Dibuat oleh Tim Intern  Getcore.ID*
