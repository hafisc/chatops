# ⚡ ChatOps - Multi-Platform Bot Orchestrator

![ChatOps Banner](https://img.shields.io/badge/ChatOps-Bot%20Orchestrator-00f2fe?style=for-the-badge&logo=telegram&logoColor=white) ![Status](https://img.shields.io/badge/Status-Active-38ef7d?style=for-the-badge) ![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)

**ChatOps** adalah asisten _Project Manager_ pintar berbentuk bot multi-platform (Telegram & WhatsApp). Bot ini secara otomatis mendata proyek baru, menangkap notifikasi pembaruan *codebase* dari GitHub, melakukan evaluasi spesifikasi dokumen dengan kecerdasan buatan, dan proaktif mengingatkan tim terkait _deadline_ setiap pagi.

## 🚀 Fitur Utama

1. **Interactive Telegram Wizard**
   Admin dapat mendaftarkan proyek baru menggunakan form interaktif (*Scenes*) langsung dari Telegram. Bot akan mencatat Repository GitHub, Group WhatsApp, link Figma, link Dokumen/SOW, dan tenggat waktu (*deadline*).

2. **GitHub Webhook Listener**
   Menangkap otomatis *event push* dari GitHub secara *non-blocking*, lalu merangkum laporan teknis *commit* menjadi bahasa manusia yang asik & elegan (menggunakan Groq AI - Llama-3-8b).

3. **AI Document Reviewer (SOW Analyzer)**
   Lewat perintah `/reviewdocs [repo]`, bot akan membaca *Google Docs* secara instan (tanpa *headless browser*), lalu Llama-3 akan bertindak sebagai *System Analyst* yang mengkritisi dokumen/proposal tersebut untuk menemukan celah bisnis/teknis. Hasil analisis dikirim ke WhatsApp tim.

4. **Proactive Daily Scrum Reminder**
   Menjalankan _Cron Job_ setiap pukul 09:00 WIB untuk memeriksa proyek mana yang belum selesai. Bot akan otomatis mengontak grup WhatsApp tim, mengingatkan sisa hari _deadline_, dan menagih dokumen/desain yang masih kurang.

5. **Cyber Y2K CLI Dashboard**
   Developer *experience* super mewah! Menggunakan `chalk`, `boxen`, `gradient-string`, dan `ora` untuk menciptakan tampilan terminal *logger* paling memanjakan mata, rata kiri secara presisi absolut.

## 🛠 Teknologi

* **Runtime:** Node.js (ES Modules) via `tsx`
* **Database:** SQLite dengan **Prisma ORM v6**
* **Telegram:** `telegraf`
* **WhatsApp:** `@whiskeysockets/baileys`
* **AI Engine:** `groq-sdk` (Llama-3-8b-8192)
* **Web Server:** `express`
* **Scheduler:** `node-cron`

## ⚙️ Persiapan & Instalasi

1. Clone repositori ini:
   ```bash
   git clone https://github.com/hafisc/chatops.git
   cd chatops
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Buat file `.env` di *root* direktori dan isikan konfigurasi berikut:
   ```env
   # Telegram Bot Token (dapatkan dari @BotFather)
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token

   # WhatsApp Session Path
   WA_SESSION_PATH=./auth_info

   # Database (Prisma SQLite)
   DATABASE_URL="file:./dev.db"

   # Groq AI Service (Dapatkan dari console.groq.com)
   GROQ_API_KEY=your_groq_api_key

   # Express Webhook Server Port
   PORT=3000

   # Optional: Admin notification saat bot online
   ADMIN_JID=6282131964839@s.whatsapp.net
   ```

4. Sinkronisasi Database (Prisma):
   ```bash
   npx prisma db push
   ```

## 🚀 Cara Menjalankan

Mode Development (dengan Hot-Reload):
```bash
npm run dev
```

Saat pertama kali dijalankan:
1. Terminal akan menampilkan QR Code WhatsApp. *Scan* QR tersebut menggunakan akun WhatsApp yang akan dijadikan Bot.
2. Bot Telegram siap digunakan. Cari bot Anda di Telegram dan ketik `/start`.
3. Gunakan *Ngrok* (`npx ngrok http 3000`) untuk mem-_forward_ webhook GitHub secara lokal.

## 📝 Konvensi Kode & Logika
* **Type-Safety:** Semua penulisan kode diwajibkan menggunakan TypeScript secara ketat (`tsc --noEmit` lolos 100%).
* **Modular:** `src/index.ts` hanya bertindak sebagai orkestrator (hanya memanggil). Logika diletakkan di filenya masing-masing.
* **Separation of Concerns:** Integrasi WhatsApp, Telegram, Express, dan AI tidak tumpang tindih.

---
Dibuat dengan ❤️ untuk merevolusi cara kerja tim _developer_.
