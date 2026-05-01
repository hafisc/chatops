/**
 * ╔══════════════════════════════════════════════════════╗
 * ║  TELEGRAM WIZARD — Setup Proyek Baru                ║
 * ╠══════════════════════════════════════════════════════╣
 * ║  File ini menangani alur pendaftaran proyek baru    ║
 * ║  secara interaktif step-by-step menggunakan         ║
 * ║  fitur WizardScene dari Telegraf.                   ║
 * ╚══════════════════════════════════════════════════════╝
 */

import { Scenes, Markup } from 'telegraf';
import { prisma } from '../../config/database.js';
import { log } from '../../utils/logger.js';
import chalk from 'chalk';

// Keyboard interaktif untuk membatalkan proses kapan saja
const cancelKeyboard = Markup.keyboard(['❌ Batal']).oneTime().resize();
const removeKeyboard = Markup.removeKeyboard();

// Middleware kecil untuk menangani pembatalan secara umum
const handleCancel = async (ctx: any): Promise<boolean> => {
  if (ctx.message && 'text' in ctx.message && ctx.message.text === '❌ Batal') {
    await ctx.reply('❌ Setup proyek dibatalkan.', removeKeyboard);
    await ctx.scene.leave();
    return true;
  }
  return false;
};

export const setupWizard = new Scenes.WizardScene<any>(
  'setupWizard',
  
  // ──────────────────────────────────────────────────────────
  // LANGKAH 1: Masukkan Nama Proyek
  // ──────────────────────────────────────────────────────────
  async (ctx) => {
    await ctx.reply(
      '<b>[1/6] Setup Proyek Baru</b>\n\nMasukkan nama proyek (contoh: Website Desa):',
      { parse_mode: 'HTML', ...cancelKeyboard }
    );
    return ctx.wizard.next();
  },

  // ──────────────────────────────────────────────────────────
  // LANGKAH 2: Masukkan Repositori GitHub
  // ──────────────────────────────────────────────────────────
  async (ctx) => {
    if (await handleCancel(ctx)) return;
    
    if (ctx.message && 'text' in ctx.message) {
      ctx.wizard.state.projectName = ctx.message.text;
      
      await ctx.reply(
        '<b>[2/6]</b> Masukkan nama repositori GitHub (contoh: <code>owner/web-desa</code>):', 
        { parse_mode: 'HTML', ...cancelKeyboard }
      );
      return ctx.wizard.next();
    }
  },

  // ──────────────────────────────────────────────────────────
  // LANGKAH 3: Masukkan ID Grup WhatsApp
  // ──────────────────────────────────────────────────────────
  async (ctx) => {
    if (await handleCancel(ctx)) return;

    if (ctx.message && 'text' in ctx.message) {
      ctx.wizard.state.githubRepo = ctx.message.text;
      
      await ctx.reply(
        '<b>[3/6]</b> Masukkan ID Grup WhatsApp target (contoh: <code>120363xxx@g.us</code>):', 
        { parse_mode: 'HTML', ...cancelKeyboard }
      );
      return ctx.wizard.next();
    }
  },

  // ──────────────────────────────────────────────────────────
  // LANGKAH 4: Masukkan Link Figma
  // ──────────────────────────────────────────────────────────
  async (ctx) => {
    if (await handleCancel(ctx)) return;

    if (ctx.message && 'text' in ctx.message) {
      ctx.wizard.state.waGroupId = ctx.message.text;
      
      await ctx.reply(
        '<b>[4/6]</b> Kirimkan link Figma (atau ketik "skip" jika tidak ada):', 
        { parse_mode: 'HTML', ...cancelKeyboard }
      );
      return ctx.wizard.next();
    }
  },

  // ──────────────────────────────────────────────────────────
  // LANGKAH 5: Masukkan Link Google Docs
  // ──────────────────────────────────────────────────────────
  async (ctx) => {
    if (await handleCancel(ctx)) return;

    if (ctx.message && 'text' in ctx.message) {
      ctx.wizard.state.figmaUrl = ctx.message.text.toLowerCase() === 'skip' ? null : ctx.message.text;
      
      await ctx.reply(
        '<b>[5/6]</b> Kirimkan link Google Docs SOW/Proposal (atau ketik "skip" jika tidak ada):', 
        { parse_mode: 'HTML', ...cancelKeyboard }
      );
      return ctx.wizard.next();
    }
  },

  // ──────────────────────────────────────────────────────────
  // LANGKAH 6: Masukkan Deadline & Simpan
  // ──────────────────────────────────────────────────────────
  async (ctx) => {
    if (await handleCancel(ctx)) return;

    if (ctx.message && 'text' in ctx.message) {
      ctx.wizard.state.docsUrl = ctx.message.text.toLowerCase() === 'skip' ? null : ctx.message.text;
      
      await ctx.reply(
        '<b>[6/6]</b> Masukkan Deadline dengan format YYYY-MM-DD (atau ketik "skip" jika tidak ada):', 
        { parse_mode: 'HTML', ...cancelKeyboard }
      );
      return ctx.wizard.next();
    }
  },

  // ──────────────────────────────────────────────────────────
  // LANGKAH 7: Validasi Deadline & Proses Simpan ke Database
  // ──────────────────────────────────────────────────────────
  async (ctx) => {
    if (await handleCancel(ctx)) return;

    if (ctx.message && 'text' in ctx.message) {
      const state = ctx.wizard.state;
      let deadlineDate = null;
      
      // Validasi Tanggal
      if (ctx.message.text.toLowerCase() !== 'skip') {
        const parsedDate = new Date(ctx.message.text);
        if (isNaN(parsedDate.getTime())) {
          // Jika salah format, wizard tetap tertahan di langkah ini (tidak next / leave)
          await ctx.reply('⚠️ Format tanggal salah. Harap gunakan format <b>YYYY-MM-DD</b> atau ketik "skip":', { parse_mode: 'HTML' });
          return; 
        }
        deadlineDate = parsedDate;
      }
      
      state.deadline = deadlineDate;

      // Tampilkan indikator proses (opsional, memberikan feedback responsif ke pengguna)
      const processingMsg = await ctx.reply('⏳ Sedang menyimpan proyek ke database...', removeKeyboard);

      try {
        // Eksekusi penyimpanan ke Prisma
        const newProject = await prisma.project.create({
          data: {
            name: state.projectName,
            githubRepo: state.githubRepo,
            waGroupId: state.waGroupId,
            figmaUrl: state.figmaUrl,
            docsUrl: state.docsUrl,
            deadline: state.deadline
          }
        });

        log.success('DB', `Proyek baru ditambahkan: ${chalk.green(newProject.name)}`);

        // Pesan Sukses nan Elegan
        const successMessage = `
🎉 <b>PROYEK BERHASIL DIBUAT!</b> 🎉
━━━━━━━━━━━━━━━━━━
<b>ID Proyek:</b> <code>${newProject.id}</code>
<b>Nama:</b> ${newProject.name}
<b>GitHub Repo:</b> <code>${newProject.githubRepo}</code>
<b>WA Group ID:</b> <code>${newProject.waGroupId}</code>

<b>Figma:</b> ${newProject.figmaUrl ? `<a href="${newProject.figmaUrl}">Buka Desain</a>` : '<i>Tidak ada</i>'}
<b>Docs:</b> ${newProject.docsUrl ? `<a href="${newProject.docsUrl}">Buka Dokumen</a>` : '<i>Tidak ada</i>'}
<b>Deadline:</b> ${newProject.deadline ? newProject.deadline.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '<i>Tidak ada</i>'}
━━━━━━━━━━━━━━━━━━
Ketik /menu untuk kembali ke dashboard.
`;
        // Hapus pesan "⏳ Sedang menyimpan..." dan ganti dengan success message
        await ctx.telegram.deleteMessage(ctx.chat.id, processingMsg.message_id);
        await ctx.reply(successMessage, { parse_mode: 'HTML', disable_web_page_preview: true });
        
        return ctx.scene.leave();

      } catch (error: any) {
        log.error('DB', 'Gagal menyimpan proyek baru', error);
        await ctx.telegram.deleteMessage(ctx.chat.id, processingMsg.message_id);
        
        let errorMessage = 'Terjadi kesalahan sistem saat menyimpan proyek.';
        // Tangani Prisma Unique Constraint Error (P2002)
        if (error.code === 'P2002') {
            errorMessage = '⚠️ <b>Repositori GitHub tersebut sudah terdaftar!</b>\nSilakan gunakan repositori yang lain untuk mencegah duplikasi data.';
        }
        
        await ctx.reply(errorMessage, { parse_mode: 'HTML' });
        return ctx.scene.leave();
      }
    }
  }
);
