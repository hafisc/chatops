/**
 * ╔══════════════════════════════════════════════════════╗
 * ║  TELEGRAM SERVICE — Bot Initialization & Validation ║
 * ╠══════════════════════════════════════════════════════╣
 * ║  Inisialisasi bot Telegram menggunakan Telegraf.    ║
 * ║  Validasi token dilakukan di awal agar masalah      ║
 * ║  konfigurasi tertangkap saat startup, bukan saat    ║
 * ║  runtime yang bikin bingung.                        ║
 * ╚══════════════════════════════════════════════════════╝
 */

import { Telegraf, session, Scenes } from 'telegraf';
import { log } from '../utils/logger.js';
import chalk from 'chalk';
import { sendDashboardMenu } from '../handlers/telegram/menu.js';
import { setupWizard } from '../handlers/telegram/setupWizard.js';
import { handleReviewDocs } from '../handlers/telegram/commands.js';

// Module-level variable — diakses via getter
// Karena menggunakan Scenes, kita set tipe generic-nya menjadi 'any' 
// agar ctx.scene.enter bisa dikenali oleh TypeScript.
let bot: Telegraf<any> | null = null;

/**
 * initTelegram() — Inisialisasi dan validasi bot Telegram
 *
 * Alur: Baca token → Buat Telegraf instance → getMe() untuk validasi
 * Mengapa validasi di awal? Token salah = masalah konfigurasi,
 * lebih baik langsung ketahuan sekarang.
 *
 * @throws Error jika token tidak ditemukan atau invalid
 */
export async function initTelegram(): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token || token.trim() === '') {
    throw new Error(
      'TELEGRAM_BOT_TOKEN tidak ditemukan di file .env!\n' +
      '  Dapatkan token dari @BotFather di Telegram:\n' +
      '  1. Buka @BotFather → /newbot\n' +
      '  2. Copy token ke file .env'
    );
  }

  bot = new Telegraf(token);

  // getMe() = cara paling reliable untuk validasi token
  const botInfo = await bot.telegram.getMe();

  log.success('TELEGRAM', `Bot terautentikasi sebagai ${chalk.bold.cyan(`@${botInfo.username}`)}`);
  log.info('TELEGRAM', `ID: ${chalk.gray(String(botInfo.id))} │ Nama: ${chalk.white(botInfo.first_name)}`);

  // ═══════════════════════════════════════════════════════
  // MIDDLEWARE WIZARD & SESSION
  // ═══════════════════════════════════════════════════════
  
  // Telegraf membutuhkan mekanisme 'session' untuk menyimpan state dari 
  // langkah-langkah di dalam Wizard (ctx.wizard.state)
  const stage = new Scenes.Stage<any>([setupWizard]);
  bot.use(session());
  bot.use(stage.middleware());

  // ═══════════════════════════════════════════════════════
  // REGISTRASI HANDLER & COMMAND
  // ═══════════════════════════════════════════════════════
  
  // Tampilkan dashboard UI saat admin mengirim /start atau /menu
  bot.start(sendDashboardMenu);
  bot.command('menu', sendDashboardMenu);

  // Command Analisis SOW
  bot.command('reviewdocs', handleReviewDocs);

  // Tangkap semua action dari tombol-tombol di dashboard.
  
  // Khusus tombol Setup Proyek: masukkan user ke dalam alur wizard
  bot!.action('action_setup_project', async (ctx) => {
    await ctx.answerCbQuery(); // Hilangkan loading pada tombol
    await ctx.scene.enter('setupWizard');
  });

  // Tombol lainnya yang belum diimplementasi
  const actionList = [
    'action_list_projects', 
    'action_manage_team', 
    'action_settings_ai', 
    'action_help'
  ];
  
  actionList.forEach(action => {
    bot!.action(action, async (ctx) => {
      // answerCbQuery memberi tahu Telegram bahwa klik sudah diproses
      await ctx.answerCbQuery('Fitur ini sedang dirakit oleh Engineer! 🚀', { show_alert: false });
    });
  });

  // Mulai mendengarkan pesan (Polling)
  bot.launch();
  log.info('TELEGRAM', 'Polling aktif. Bot siap menerima command.');
}

/**
 * getTelegramBot() — Getter untuk instance bot
 * Mengapa getter? Karena `bot` baru ada setelah initTelegram().
 * Consumer dipaksa handle null → lebih type-safe.
 */
export function getTelegramBot(): Telegraf | null {
  return bot;
}
