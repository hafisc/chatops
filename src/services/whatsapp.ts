/**
 * ╔══════════════════════════════════════════════════════╗
 * ║  WHATSAPP SERVICE — Baileys Connection Manager      ║
 * ╠══════════════════════════════════════════════════════╣
 * ║  Menangani koneksi WhatsApp Multi-Device via        ║
 * ║  Baileys: session management, QR rendering, dan     ║
 * ║  auto-reconnect.                                    ║
 * ╚══════════════════════════════════════════════════════╝
 */

import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  type WASocket,
  fetchLatestBaileysVersion,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import qrcode from 'qrcode-terminal';
import { log } from '../utils/logger.js';
import chalk from 'chalk';
import boxen from 'boxen';
import pino from 'pino';

// Module-level state — satu koneksi WhatsApp aktif
let waSocket: WASocket | null = null;

/**
 * initWhatsApp() — Inisialisasi koneksi WhatsApp via Baileys
 *
 * Alur: Load session → Fetch versi → Buat socket → Handle QR/reconnect
 * Return Promise yang resolve saat connection = 'open'.
 */
export function initWhatsApp(): Promise<void> {
  const SESSION_PATH = process.env.WA_SESSION_PATH || './auth_info';

  return new Promise(async (resolve, reject) => {
    try {
      // Load auth state dari disk — skip QR jika session sudah ada
      const { state, saveCreds } = await useMultiFileAuthState(SESSION_PATH);

      // Fetch versi terbaru untuk kompatibilitas protokol
      const { version, isLatest } = await fetchLatestBaileysVersion();
      log.info('WA', `Baileys v${version.join('.')} ${isLatest ? chalk.green('(terbaru)') : chalk.yellow('(update tersedia)')}`);

      // Buat socket — logger silent agar terminal kita bersih
      const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }) as any,
        browser: ['ChatOps Bot', 'Chrome', '22.0'],
      });

      waSocket = sock;

      // ═══ CONNECTION UPDATE HANDLER ═══
      sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        // Render QR code cantik di terminal
        if (qr) {
          log.divider();
          log.info('WA', '📱 Scan QR Code berikut dengan WhatsApp:');
          console.log('');
          qrcode.generate(qr, { small: true }, (qrArt: string) => {
            console.log(
              boxen(qrArt, {
                padding: 1,
                margin: { top: 0, bottom: 0, left: 3, right: 3 },
                borderStyle: 'round',
                borderColor: 'green',
                title: ' 📲 WhatsApp QR Code ',
                titleAlignment: 'center',
              })
            );
          });
          console.log(chalk.gray('     💡 QR akan refresh otomatis jika expired.\n'));
        }

        // Koneksi berhasil → resolve promise
        if (connection === 'open') {
          const user = sock.user;
          log.success('WA', `Terhubung sebagai ${chalk.bold.green(user?.name || user?.id || 'Unknown')}`);
          resolve();
        }

        // Koneksi tertutup → reconnect atau stop
        if (connection === 'close') {
          const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
          const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

          if (shouldReconnect) {
            log.warn('WA', `Koneksi terputus (code: ${statusCode}). Reconnecting...`);
            initWhatsApp().then(resolve).catch(reject);
          } else {
            log.error('WA', 'Sesi di-logout. Hapus folder auth_info dan scan ulang.');
            reject(new Error('WhatsApp session logged out'));
          }
        }
      });

      // Simpan credentials setiap update — krusial untuk session persistence
      sock.ev.on('creds.update', saveCreds);

      // ═══ MESSAGE UPSERT HANDLER (Fitur /getid) ═══
      sock.ev.on('messages.upsert', async (m) => {
        if (m.type !== 'notify') return;
        
        const msg = m.messages[0];
        if (!msg || !msg.message || msg.key.fromMe) return;

        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';

        if (text === '/getid') {
          const remoteJid = msg.key.remoteJid;
          if (remoteJid) {
            log.info('WA', `Command /getid diterima dari ${chalk.cyan(remoteJid)}`);
            await sock.sendMessage(remoteJid, {
              text: `🤖 ID untuk chat ini adalah: ${remoteJid}`
            });
          }
        }
      });

    } catch (error) {
      log.error('WA', 'Gagal menginisialisasi WhatsApp.', error);
      reject(error);
    }
  });
}

/** Getter untuk WASocket — digunakan handler lain untuk kirim pesan */
export function getWhatsAppSocket(): WASocket | null {
  return waSocket;
}
