/**
 * ╔══════════════════════════════════════════════════════╗
 * ║  TELEGRAM COMMANDS HANDLER                          ║
 * ╠══════════════════════════════════════════════════════╣
 * ║  Memisahkan logika command Telegram dari file       ║
 * ║  konfigurasi utama agar rapi.                       ║
 * ╚══════════════════════════════════════════════════════╝
 */

import { Context } from 'telegraf';
import { prisma } from '../../config/database.js';
import { fetchGoogleDocText } from '../../utils/docScraper.js';
import { analyzeDocument } from '../../services/groq.js';
import { getWhatsAppSocket } from '../../services/whatsapp.js';
import { log } from '../../utils/logger.js';
import chalk from 'chalk';

/**
 * handleReviewDocs() — Command: /reviewdocs [repo_name]
 */
export async function handleReviewDocs(ctx: Context) {
  try {
    // 1. Ekstrak argumen dari pesan
    const messageText = (ctx.message as any)?.text || '';
    const args = messageText.split(' ');
    
    if (args.length < 2) {
      return await ctx.reply('⚠️ *Format salah!*\nGunakan: `/reviewdocs [nama_repo]`\nContoh: `/reviewdocs owner/web-desa`', { parse_mode: 'Markdown' });
    }

    const githubRepo = args[1];

    // 2. Cari proyek di Database
    const project = await prisma.project.findUnique({
      where: { githubRepo },
    });

    if (!project) {
      return await ctx.reply(`❌ Proyek dengan repositori <code>${githubRepo}</code> tidak ditemukan di database.`, { parse_mode: 'HTML' });
    }

    if (!project.docsUrl) {
      return await ctx.reply(`⚠️ Link dokumen (SOW/Proposal) belum disetup untuk proyek <b>${project.name}</b>.`, { parse_mode: 'HTML' });
    }

    if (!project.waGroupId) {
      return await ctx.reply(`⚠️ WhatsApp Group ID belum disetup untuk proyek <b>${project.name}</b>.`, { parse_mode: 'HTML' });
    }

    // 3. Konfirmasi proses ke Telegram
    const statusMsg = await ctx.reply(`⏳ Sedang mengunduh dan menganalisis dokumen untuk <b>${project.name}</b>...\nMohon tunggu sekitar 5-10 detik.`, { parse_mode: 'HTML' });

    // 4. Ekstrak Teks dari Google Docs
    let documentText: string;
    try {
      documentText = await fetchGoogleDocText(project.docsUrl);
    } catch (error: any) {
      log.error('TELEGRAM', `Scraper gagal: ${error.message}`);
      return await ctx.telegram.editMessageText(
        ctx.chat?.id,
        statusMsg.message_id,
        undefined,
        `❌ <b>Gagal membaca dokumen:</b>\n${error.message}`,
        { parse_mode: 'HTML' }
      );
    }

    // 5. Analisis via AI
    let aiReview: string;
    try {
      aiReview = await analyzeDocument(documentText, project.name);
    } catch (error: any) {
      return await ctx.telegram.editMessageText(
        ctx.chat?.id,
        statusMsg.message_id,
        undefined,
        `❌ <b>Gagal menganalisis dokumen via AI:</b>\n${error.message}`,
        { parse_mode: 'HTML' }
      );
    }

    // 6. Kirim Hasil ke WhatsApp
    const waSocket = getWhatsAppSocket();
    if (!waSocket) {
      return await ctx.telegram.editMessageText(
        ctx.chat?.id,
        statusMsg.message_id,
        undefined,
        `❌ <b>Koneksi WhatsApp belum siap.</b>`,
        { parse_mode: 'HTML' }
      );
    }

    await waSocket.sendMessage(project.waGroupId, { text: aiReview });

    // 7. Update status di Telegram
    await ctx.telegram.editMessageText(
      ctx.chat?.id,
      statusMsg.message_id,
      undefined,
      `✅ <b>Selesai!</b>\n\nHasil review AI yang tajam untuk proyek <b>${project.name}</b> telah berhasil dikirimkan ke grup WhatsApp tim.`,
      { parse_mode: 'HTML' }
    );

    log.success('TELEGRAM', `Review docs selesai untuk ${chalk.green(project.name)}`);

  } catch (error: any) {
    log.error('TELEGRAM', 'Fatal error di handleReviewDocs', error);
    await ctx.reply('❌ Terjadi kesalahan fatal pada sistem saat memproses command.');
  }
}
