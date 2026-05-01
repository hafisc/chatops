/**
 * ╔══════════════════════════════════════════════════════╗
 * ║  GITHUB WEBHOOK HANDLER                             ║
 * ╠══════════════════════════════════════════════════════╣
 * ║  Menangkap event push dari GitHub, merapikannya via ║
 * ║  Groq AI, dan menyebarkannya ke grup WhatsApp.      ║
 * ║                                                      ║
 * ║  Prinsip Penting: NON-BLOCKING                      ║
 * ║  Beri respons 200 OK ke GitHub secepat mungkin agar ║
 * ║  tidak terjadi timeout. Biarkan proses AI & WA      ║
 * ║  berjalan di background (Asynchronous).             ║
 * ╚══════════════════════════════════════════════════════╝
 */

import { Router, Request, Response } from 'express';
import { prisma } from '../config/database.js';
import { formatCommitMessage } from '../services/groq.js';
import { getWhatsAppSocket } from '../services/whatsapp.js';
import { log } from '../utils/logger.js';
import chalk from 'chalk';

export const webhookRouter = Router();

// Endpoint: POST /webhook/github
webhookRouter.post('/github', (req: Request, res: Response) => {
  // 1. NON-BLOCKING: Langsung beri respons OK ke GitHub
  res.status(200).send('OK');

  // Abaikan event selain push (contoh: ping dari GitHub saat webhook baru dibuat)
  if (req.headers['x-github-event'] !== 'push') {
    return;
  }

  // Jalankan background job secara independen
  processWebhookPayload(req.body).catch((err) => {
    log.error('WEBHOOK', 'Background job gagal', err);
  });
});

/**
 * processWebhookPayload() — Background Job
 */
async function processWebhookPayload(payload: any) {
  // 2. Ekstrak data krusial dari Payload GitHub
  const repoName = payload.repository?.full_name || payload.repository?.name;
  const pusherName = payload.pusher?.name;
  const commits = payload.commits || [];

  if (!repoName || commits.length === 0) {
    // Abaikan push yang tidak ada commit-nya (misal push tag/branch kosong)
    return;
  }

  const commitMessages = commits.map((c: any) => c.message);

  log.info('WEBHOOK', `Menerima push dari ${chalk.green(pusherName)} untuk repo ${chalk.cyan(repoName)}`);

  try {
    // 3. Validasi Proyek di Database
    const project = await prisma.project.findUnique({
      where: { githubRepo: repoName },
    });

    if (!project) {
      log.warn('WEBHOOK', `Proyek ${repoName} belum diregistrasi via Telegram. Push diabaikan.`);
      return; // Berhenti di sini
    }

    if (!project.waGroupId) {
      log.warn('WEBHOOK', `Proyek ${repoName} tidak memiliki WA Group ID. Push diabaikan.`);
      return;
    }

    log.info('AI', `Memproses ${commitMessages.length} commit untuk proyek ${project.name}...`);

    // 4. Proses via AI (Groq)
    const formattedMessage = await formatCommitMessage(pusherName, repoName, commitMessages);

    // 5. Kirim via WhatsApp (Baileys)
    const waSocket = getWhatsAppSocket();
    if (!waSocket) {
      throw new Error('Koneksi WhatsApp belum siap!');
    }

    await waSocket.sendMessage(project.waGroupId, {
      text: formattedMessage,
    });

    log.success('WA', `Laporan berhasil dikirim ke grup untuk proyek ${chalk.green(project.name)}`);

  } catch (error) {
    log.error('WEBHOOK', `Gagal memproses Webhook untuk ${repoName}`, error);
  }
}
