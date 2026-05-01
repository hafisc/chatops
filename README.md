# 🚀 ChatOps Multi-Platform Bot Orchestratord

Bot asisten Project Manager cerdas yang dibangun dengan TypeScript, Telegraf, dan Baileys. Sistem ini mengombinasikan interface Telegram untuk setup project interaktif, dan interface WhatsApp untuk broadcast laporan otomatis (seperti GitHub webhook dan analisis dokumen SOW) menggunakan AI Groq (Llama-3), lengkap dengan UI/UX pesan dan terminal yang sangat memukau.

## ✨ Features

- 📱 **Multi-Platform Integration** - Kombinasi Telegram (Dashboard & Wizard) dan WhatsApp (Baileys) dengan auto-reconnect
- 🤖 **Groq AI Engine** - Menggunakan Llama-3-8b untuk merangkum log commit dan mereview dokumen SOW secara pintar
- 🔗 **GitHub Webhook** - Endpoint Express.js non-blocking untuk notifikasi commit secara real-time
- 📋 **Automated Scheduler** - Cron job (Daily Scrum) untuk mengingatkan deadline dan menagih dokumen yang kurang via WA
- 💬 **Modern UI/UX** - Formatting pesan yang elegan di WhatsApp/Telegram, ditambah terminal console bergaya Cyber Y2K
- 🛡️ **Production Ready** - Strict TypeScript, SQLite Prisma DB, dan graceful error handling

## 📦 Tech Stack

- **@whiskeysockets/baileys** - Library untuk koneksi WhatsApp Web
- **telegraf** - Framework untuk membuat bot Telegram
- **prisma** - ORM modern (dengan SQLite) untuk manajemen database project
- **express** - Web framework untuk webhook endpoint GitHub
- **groq-sdk** - SDK AI untuk analisis dokumen
- **node-cron** - Task scheduler untuk pengingat otomatis
- **chalk, boxen, ora** - Library untuk estetika UI/UX Terminal

## 🏗️ Project Structure

```text
src/
├── config/         # Konfigurasi (Database Prisma, Express Server)
├── handlers/       # Logika spesifik per fitur (Telegram Webhook, Webhook GitHub)
├── services/       # Service layer inti (Telegram, WhatsApp, Groq AI, Cron)
├── utils/          # Fungsi bantuan (DocScraper, UI Logger Premium)
└── index.ts        # Main Entry Point / Orchestrator
```

## 🚀 Setup & Installation

### 1. Install Dependencies

```bash
# Install seluruh dependencies utama & development
npm install
```

### 2. Configure Environment

Buat file `.env` dan sesuaikan nilainya:

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

### 3. Sinkronisasi Database

```bash
npx prisma db push
```

### 4. Run Development Server

```bash
npm run dev
```

### 5. Build for Production

```bash
npm run build
npm start
```

## 📝 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Jalankan development server (tsx watch) dengan hot reload |
| `npm run build` | Compile TypeScript ke JavaScript (dist/) |
| `npm start` | Jalankan production build dari folder dist |

## 🎯 Package Explanations

### Main Dependencies

- **@whiskeysockets/baileys** - Library koneksi WhatsApp tanpa browser (WebSockets).
- **telegraf** - Framework Telegram Bot API dengan kapabilitas State Management (Scenes).
- **prisma** - Database toolkit untuk manipulasi data yang fully type-safe.
- **express** - Framework HTTP server untuk menerima GitHub webhook.
- **groq-sdk** - Wrapper untuk inferensi LLM ultra-cepat (Llama-3).

### UI/Terminal Dependencies

- **chalk & gradient-string** - Memberikan pewarnaan string console.
- **boxen & figlet** - Membangun kotak (panel) dan tulisan ASCII Art megah.
- **ora** - Terminal spinner interaktif.

## 🔧 TypeScript Configuration

`tsconfig.json` sudah dikonfigurasi dengan:

- ✅ **ES Modules (ES2022)** - Support Node16+ `type: "module"`
- ✅ **Strict Mode** - Type checking maksimal untuk menghindari bugs
- ✅ **Module Resolution** - NodeNext
- ✅ **Output Directory** - Compiled files ke `./dist`

## 📚 Next Steps

1. Pastikan Anda melakukan registrasi project via `/start` di Telegram.
2. Sambungkan link `Ngrok` lokal Anda ke Repository Webhook GitHub.
3. Tunggu hingga cron job berjalan pukul 09.00 WIB untuk melihat fungsi *Daily Scrum Master*!

## 📄 License

ISC

---

**Built with ❤️ using TypeScript, Telegraf, & Baileys**
