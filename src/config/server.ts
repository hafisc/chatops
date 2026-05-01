/**
 * ╔══════════════════════════════════════════════════════╗
 * ║  EXPRESS SERVER CONFIG                              ║
 * ╠══════════════════════════════════════════════════════╣
 * ║  Menyiapkan server Express untuk menangkap webhook  ║
 * ║  dari layanan eksternal (GitHub, Figma, dll).       ║
 * ╚══════════════════════════════════════════════════════╝
 */

import express from 'express';
import { webhookRouter } from '../handlers/webhook.js';
import { log } from '../utils/logger.js';
import chalk from 'chalk';

const app = express();

// Middleware parsing JSON dengan limit standar
app.use(express.json({ limit: '10mb' }));

// Mount webhook router
app.use('/webhook', webhookRouter);

/**
 * startServer() — Memulai server Express
 */
export function startServer(): Promise<void> {
  const PORT = process.env.PORT || 3000;

  return new Promise((resolve) => {
    app.listen(PORT, () => {
      log.success('SERVER', `Express Webhook aktif di ${chalk.bold.blue(`http://localhost:${PORT}`)}`);
      resolve();
    });
  });
}
