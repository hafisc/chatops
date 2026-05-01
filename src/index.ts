/**
 * ╔══════════════════════════════════════════════════════╗
 * ║  CHATOPS — MAIN ENTRY POINT (ORCHESTRATOR)          ║
 * ╠══════════════════════════════════════════════════════╣
 * ║  File ini HANYA orchestrator. Tidak ada logika      ║
 * ║  bisnis di sini — semua didelegasikan ke modul      ║
 * ║  masing-masing (Separation of Concerns).            ║
 * ║                                                      ║
 * ║  Startup: Banner → DB → Telegram → WhatsApp → Ready ║
 * ╚══════════════════════════════════════════════════════╝
 */

/** ChatOps — Multi-Platform Bot Orchestrator */
import 'dotenv/config';
import { log } from './utils/logger.js';
import { connectDB, disconnectDB } from './config/database.js';
import { initTelegram } from './services/telegram.js';
import { initWhatsApp, getWhatsAppSocket } from './services/whatsapp.js';
import { startServer } from './config/server.js';
import { initCronJobs } from './services/cron.js';
import chalk from 'chalk';

/**
 * bootstrap() — Orkestrasi seluruh startup sequence
 *
 * Sequential karena tiap tahap bergantung pada tahap sebelumnya:
 * DB harus siap → Telegram perlu DB → WhatsApp terakhir (butuh QR scan)
 */
async function bootstrap(): Promise<void> {
  try {
    // ═══ TAHAP 0: Banner megah ═══
    console.clear();
    log.banner('ChatOps', '⚡ Multi-Platform Bot Orchestrator ⚡');
    log.info('SYSTEM', chalk.gray('v1.0.0 — Telegram + WhatsApp Unified Bot'));
    log.divider();

    // ═══ TAHAP 1: Database ═══
    // Fondasi — semua data bot disimpan di sini
    const dbSpinner = log.spinner('DB', 'Menghubungkan ke database SQLite...');
    try {
      await connectDB();
      dbSpinner.stop();
      log.success('DB', 'Database SQLite terhubung & siap!');
    } catch {
      dbSpinner.stop();
      log.error('DB', 'Gagal terhubung ke database!');
      process.exit(1);
    }

    // ═══ TAHAP 2: Telegram ═══
    // Validasi token sebelum mulai listen pesan
    const tgSpinner = log.spinner('TELEGRAM', 'Memvalidasi token Telegram Bot...');
    try {
      await initTelegram();
      tgSpinner.stop();
      log.success('TELEGRAM', 'Telegram Bot terautentikasi & siap!');
    } catch (err) {
      tgSpinner.stop();
      log.error('TELEGRAM', 'Gagal menginisialisasi Telegram! Pastikan TELEGRAM_BOT_TOKEN di .env sudah benar.', err);
      process.exit(1);
    }

    // ═══ TAHAP 3: WhatsApp ═══
    // Terakhir karena bisa butuh interaksi manual (scan QR)
    const waSpinner = log.spinner('WA', 'Menginisialisasi koneksi WhatsApp...');
    try {
      waSpinner.stop();
      await initWhatsApp();
      log.success('WA', 'WhatsApp terhubung & siap menerima pesan!');
    } catch (err) {
      log.error('WA', 'Gagal menginisialisasi WhatsApp.', err);
      process.exit(1);
    }

    // ═══ TAHAP 4: Express Webhook Server ═══
    // Berjalan di belakang layar untuk menerima push event GitHub
    const serverSpinner = log.spinner('SERVER', 'Menyiapkan Express Webhook...');
    try {
      await startServer();
      serverSpinner.stop();
    } catch (err) {
      serverSpinner.stop();
      log.error('SERVER', 'Gagal menjalankan Express Server.', err);
      process.exit(1);
    }

    // ═══ TAHAP 5: Background Cron Jobs ═══
    // Mengaktifkan AI Scrum Master harian
    try {
      initCronJobs();
    } catch (err) {
      log.error('CRON', 'Gagal menginisialisasi Cron Jobs.', err);
      // Kita tidak exit(1) karena bot tetap bisa jalan tanpa cron
    }

    // ═══ TAHAP 6: ALL SYSTEMS GO! 🎉 ═══
    log.divider();

    log.panel(
      '🚀 CHATOPS READY',
      [
        log.gradient.neon('  ✨ Semua sistem beroperasi penuh! ✨'),
        '',
        `  ${chalk.green('●')} Database   ${chalk.gray('──')} ${chalk.greenBright('Connected')}`,
        `  ${chalk.green('●')} Telegram   ${chalk.gray('──')} ${chalk.greenBright('Authenticated')}`,
        `  ${chalk.green('●')} WhatsApp   ${chalk.gray('──')} ${chalk.greenBright('Connected')}`,
        `  ${chalk.green('●')} Webhook    ${chalk.gray('──')} ${chalk.greenBright('Listening')}`,
        `  ${chalk.green('●')} Scheduler  ${chalk.gray('──')} ${chalk.greenBright('Active')}`,
      ].join('\n'),
      'green'
    );

    // ═══ Notifikasi ke Admin WA (Opsional) ═══
    const waSocket = getWhatsAppSocket();
    const adminJid = process.env.ADMIN_JID;
    if (adminJid && waSocket) {
      try {
        await waSocket.sendMessage(adminJid, { 
          text: '🚀 *ChatOps Bot Online!*\n\nSemua sistem (DB, Telegram, WhatsApp, Webhook, Scheduler) telah beroperasi dengan normal.' 
        });
        log.success('WA', `Notifikasi online berhasil dikirim ke Admin`);
      } catch (err) {
        log.warn('WA', `Gagal mengirim notifikasi admin ke ${adminJid}`);
      }
    }

    log.panel(
      '💡 TIPS',
      [
        `  ${chalk.yellow('▸')} Ketik ${chalk.cyan('/help')} di Telegram atau WhatsApp`,
        `  ${chalk.yellow('▸')} Tekan ${chalk.cyan('Ctrl+C')} untuk shutdown yang aman`,
        `  ${chalk.yellow('▸')} Logs akan muncul real-time di terminal ini`,
      ].join('\n'),
      'yellow'
    );

  } catch (error) {
    log.error('SYSTEM', 'Error fatal saat startup!', error);
    process.exit(1);
  }
}

// ═══ GRACEFUL SHUTDOWN ═══
// Menutup semua koneksi dengan aman sebelum exit
const gracefulShutdown = async (signal: string): Promise<void> => {
  log.divider();
  log.warn('SYSTEM', `Sinyal ${chalk.bold(signal)} diterima. Shutting down...`);
  try {
    await disconnectDB();
    log.success('SYSTEM', 'Semua koneksi ditutup. Sampai jumpa! 👋');
  } catch (err) {
    log.error('SYSTEM', 'Error saat shutdown.', err);
  }
  process.exit(0);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// ═══ LAUNCH! ═══
bootstrap();
