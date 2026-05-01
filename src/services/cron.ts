/**
 * ╔══════════════════════════════════════════════════════╗
 * ║  CRON JOBS SERVICE — Proactive AI Assistant         ║
 * ╠══════════════════════════════════════════════════════╣
 * ║  Menjalankan tugas-tugas terjadwal di background.   ║
 * ║  Membuat bot tidak hanya reaktif, tapi proaktif     ║
 * ║  mengingatkan tim layaknya Project Manager asli.    ║
 * ╚══════════════════════════════════════════════════════╝
 */

import cron from 'node-cron';
import { prisma } from '../config/database.js';
import { generateDailyReminder } from './groq.js';
import { getWhatsAppSocket } from './whatsapp.js';
import { log } from '../utils/logger.js';
import chalk from 'chalk';

/**
 * initCronJobs() — Mendaftarkan semua jadwal tugas
 */
export function initCronJobs() {
  log.info('CRON', 'Mendaftarkan sistem penjadwalan otomatis...');

  // ────────────────────────────────────────────────────────
  // JOB 1: Daily Scrum Reminder (Setiap jam 09:00 WIB)
  // ────────────────────────────────────────────────────────
  cron.schedule('0 9 * * *', async () => {
    log.info('CRON', 'Menjalankan tugas: Daily Scrum Reminder...');
    
    try {
      // 1. Ambil semua proyek yang punya deadline dan belum kedaluwarsa
      const now = new Date();
      // Set waktu 'now' ke awal hari untuk komparasi yang presisi
      now.setHours(0, 0, 0, 0);

      const activeProjects = await prisma.project.findMany({
        where: {
          deadline: {
            gte: now, // Greater than or equal to today
          },
          waGroupId: {
            not: '', // Pastikan ada grup WA
          }
        }
      });

      if (activeProjects.length === 0) {
        log.info('CRON', 'Tidak ada proyek aktif dengan deadline di masa depan.');
        return;
      }

      const waSocket = getWhatsAppSocket();
      if (!waSocket) {
        throw new Error('Koneksi WhatsApp belum siap untuk broadcast.');
      }

      // 2. Looping setiap proyek untuk dianalisis dan dibroadcast
      for (const project of activeProjects) {
        if (!project.deadline) continue;

        // Hitung sisa hari (akurasi berbasis timezone lokal)
        const diffTime = project.deadline.getTime() - now.getTime();
        const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Cek kelengkapan aset proyek
        const isFigmaMissing = !project.figmaUrl || project.figmaUrl.toLowerCase() === 'skip';
        const isDocsMissing = !project.docsUrl || project.docsUrl.toLowerCase() === 'skip';

        // 3. Generate pesan motivasi via AI
        const reminderMsg = await generateDailyReminder(
          project.name,
          daysRemaining,
          isFigmaMissing,
          isDocsMissing
        );

        // 4. Kirim ke Grup WA terkait
        await waSocket.sendMessage(project.waGroupId, { text: reminderMsg });
        
        log.success('CRON', `Reminder terkirim untuk proyek ${chalk.green(project.name)} (${daysRemaining} hari lagi)`);
        
        // Kasih jeda 2 detik antar pengiriman agar tidak dianggap spam oleh WA
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      log.success('CRON', 'Semua tugas Daily Scrum Reminder selesai dieksekusi.');

    } catch (error) {
      log.error('CRON', 'Gagal menjalankan Daily Scrum Reminder', error);
    }
  }, {
    timezone: 'Asia/Jakarta'
  });

  // Jika ada job lain (misal Weekly Report), tambahkan di sini

  log.success('CRON', 'Scheduler aktif! Menunggu jadwal eksekusi...');
}
