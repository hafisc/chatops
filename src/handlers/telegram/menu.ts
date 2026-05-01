/**
 * ╔══════════════════════════════════════════════════════╗
 * ║  TELEGRAM DASHBOARD UI — Menu Utama Bot             ║
 * ╠══════════════════════════════════════════════════════╣
 * ║  File ini menangani rendering antarmuka pengguna    ║
 * ║  (UI) di Telegram saat command /start atau /menu    ║
 * ║  dipanggil.                                         ║
 * ║                                                      ║
 * ║  Mengapa pakai HTML dan Inline Keyboard?            ║
 * ║  HTML memberikan kontrol tipografi yang lebih baik  ║
 * ║  (bold, italic, monospace/code block). Sedangkan    ║
 * ║  Inline Keyboard memberikan pengalaman navigasi     ║
 * ║  seperti aplikasi (app-like experience) daripada    ║
 * ║  sekadar membalas dengan teks.                      ║
 * ╚══════════════════════════════════════════════════════╝
 */

import { Context, Markup } from 'telegraf';
import { prisma } from '../../config/database.js';
import { log } from '../../utils/logger.js';

/**
 * sendDashboardMenu() — Mengirimkan tampilan dashboard utama ke Telegram
 * 
 * Fungsi ini dinamis, dapat digunakan untuk merespons pesan baru
 * (command) maupun mengupdate pesan lama (callback query dari tombol).
 */
export async function sendDashboardMenu(ctx: Context) {
  try {
    // 1. Ambil jumlah proyek dari database (Statistik Cepat)
    const projectCount = await prisma.project.count();

    // 2. Dapatkan nama admin (fallback ke 'Admin' jika tidak diset)
    const adminName = ctx.from?.first_name || 'Admin';

    // 3. Format waktu saat ini (WIB) untuk memberikan kesan real-time
    const now = new Date();
    const timeOptions: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    };
    const currentTime = now.toLocaleDateString('id-ID', timeOptions);

    // 4. Susun pesan dengan HTML (Tipografi profesional)
    const messageText = `
<b>🤖 BOT PM ASSISTANT</b>
<i>Smart Project Manager</i>
━━━━━━━━━━━━━━━━━━

Halo, <b>${adminName}</b>! 👋
🕒 <code>${currentTime}</code>

<b>Statistik Cepat:</b>
📂 Total Proyek: <b>${projectCount} Proyek</b>

Silakan pilih menu di bawah ini untuk mengelola operasi:
`;

    // 5. Susun Inline Keyboard (Tombol Interaktif)
    const keyboard = Markup.inlineKeyboard([
      // Baris 1: Tombol utama (Call to Action utama, 1 baris penuh)
      [Markup.button.callback('➕ Setup Proyek Baru', 'action_setup_project')],
      // Baris 2: Sub-menu operasional (Dibagi 2 kolom)
      [
        Markup.button.callback('📊 Daftar Proyek', 'action_list_projects'),
        Markup.button.callback('👥 Kelola Tim', 'action_manage_team')
      ],
      // Baris 3: Menu pendukung (Dibagi 2 kolom)
      [
        Markup.button.callback('⚙️ Pengaturan AI', 'action_settings_ai'),
        Markup.button.callback('❓ Bantuan', 'action_help')
      ]
    ]);

    // 6. Kirim atau Edit pesan
    // Jika ctx dipicu oleh klik tombol (callback query), kita edit pesannya
    // agar tidak membuat terminal chat berantakan (spam).
    // Jika dipicu oleh command, kita kirim pesan baru.
    if (ctx.callbackQuery) {
      await ctx.editMessageText(messageText, { parse_mode: 'HTML', ...keyboard });
    } else {
      await ctx.reply(messageText, { parse_mode: 'HTML', ...keyboard });
    }
  } catch (error) {
    log.error('TELEGRAM', 'Gagal memuat dashboard menu', error);
    await ctx.reply('Terjadi kesalahan sistem saat memuat menu. Silakan coba lagi nanti.');
  }
}

/**
 * handleListProjects() — Handler tombol "Daftar Proyek"
 */
export async function handleListProjects(ctx: Context) {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5 // Batasi 5 terbaru agar pesan tidak terlalu panjang
    });

    let messageText = `<b>📊 DAFTAR PROYEK (5 Terbaru)</b>\n━━━━━━━━━━━━━━━━━━\n\n`;

    if (projects.length === 0) {
      messageText += `<i>Belum ada proyek yang terdaftar.</i>\n\nSilakan klik "Setup Proyek Baru" di menu utama.`;
    } else {
      projects.forEach((p, i) => {
        const deadlineStr = p.deadline ? p.deadline.toLocaleDateString('id-ID') : 'Tidak ada';
        messageText += `<b>${i + 1}. ${p.name}</b>\n`;
        messageText += `   📦 Repo: <code>${p.githubRepo}</code>\n`;
        messageText += `   ⏳ Deadline: ${deadlineStr}\n\n`;
      });
    }

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('🔙 Kembali ke Menu', 'action_back_to_menu')]
    ]);

    await ctx.editMessageText(messageText, { parse_mode: 'HTML', ...keyboard });
  } catch (error) {
    log.error('TELEGRAM', 'Gagal memuat daftar proyek', error);
  }
}

/**
 * handleManageTeam() — Handler tombol "Kelola Tim"
 */
export async function handleManageTeam(ctx: Context) {
  const messageText = `
<b>👥 KELOLA TIM</b>
━━━━━━━━━━━━━━━━━━

Modul ini akan segera hadir! Nantinya Anda dapat:
- Menghubungkan kontak WA tim
- Menugaskan anggota ke proyek
- Melacak *performance* anggota

<i>Stay tuned!</i> 🚀
`;
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('🔙 Kembali', 'action_back_to_menu')]
  ]);
  await ctx.editMessageText(messageText, { parse_mode: 'HTML', ...keyboard });
}

/**
 * handleAISettings() — Handler tombol "Pengaturan AI"
 */
export async function handleAISettings(ctx: Context) {
  const isKeySet = !!process.env.GROQ_API_KEY;
  const messageText = `
<b>⚙️ PENGATURAN AI (GROQ)</b>
━━━━━━━━━━━━━━━━━━

🤖 <b>Engine:</b> Llama-3-8b-8192
🔌 <b>API Status:</b> ${isKeySet ? '🟢 Terhubung' : '🔴 Tidak Ditemukan'}

AI digunakan untuk:
1. Merangkum GitHub Commits
2. Mereview Proposal (SOW)
3. Mengirim motivasi Daily Scrum
`;
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('🔙 Kembali', 'action_back_to_menu')]
  ]);
  await ctx.editMessageText(messageText, { parse_mode: 'HTML', ...keyboard });
}

/**
 * handleHelp() — Handler tombol "Bantuan"
 */
export async function handleHelp(ctx: Context) {
  const messageText = `
<b>❓ PUSAT BANTUAN</b>
━━━━━━━━━━━━━━━━━━

Berikut adalah daftar perintah yang tersedia:

/start atau /menu - Membuka Dashboard Utama
/reviewdocs <code>[repo]</code> - Menyuruh AI mereview dokumen proyek

<b>Butuh Bantuan Ekstra?</b>
Pastikan terminal di server berjalan tanpa error merah.
`;
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('🔙 Kembali', 'action_back_to_menu')]
  ]);
  await ctx.editMessageText(messageText, { parse_mode: 'HTML', ...keyboard });
}

