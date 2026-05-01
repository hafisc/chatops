/**
 * ╔══════════════════════════════════════════════════════╗
 * ║  LOGGER UTILITY — Cyber Y2K Terminal Aesthetics     ║
 * ╠══════════════════════════════════════════════════════╣
 * ║  Modul ini bertanggung jawab atas semua output ke   ║
 * ║  terminal. Setiap log memiliki tag berwarna dan     ║
 * ║  format konsisten agar developer experience terasa  ║
 * ║  premium dan mudah di-debug.                        ║
 * ║                                                      ║
 * ║  Kenapa buat wrapper dan bukan console.log biasa?   ║
 * ║  Karena kita ingin SATU sumber kebenaran untuk      ║
 * ║  semua output — kalau suatu hari perlu kirim log    ║
 * ║  ke file atau monitoring service, kita hanya perlu  ║
 * ║  ubah di sini saja.                                 ║
 * ╚══════════════════════════════════════════════════════╝
 */

import chalk from 'chalk';
import ora, { type Ora } from 'ora';
import boxen from 'boxen';
import figlet from 'figlet';
import gradient from 'gradient-string';

// ═══════════════════════════════════════════════════════
// TAG DEFINITIONS
// Setiap subsistem punya tag unik dengan warna berbeda
// agar mudah dibedakan saat scrolling log di terminal.
// Warna dipilih berdasarkan konvensi:
// - Cyan: Sistem/infrastruktur
// - Magenta: Database (data = ungu/magenta di banyak IDE)
// - Blue: Telegram (sesuai brand)
// - Green: WhatsApp (sesuai brand)
// ═══════════════════════════════════════════════════════

type LogTag = 'SYSTEM' | 'DB' | 'TELEGRAM' | 'WA' | 'API' | 'ERROR' | 'WARN' | 'SERVER' | 'WEBHOOK' | 'AI' | 'CRON';

const TAG_STYLES: Record<LogTag, (text: string) => string> = {
  SYSTEM:   (t) => chalk.bgCyan.black.bold(` ${t} `),
  DB:       (t) => chalk.bgMagenta.white.bold(` ${t} `),
  TELEGRAM: (t) => chalk.bgBlue.white.bold(` ${t} `),
  WA:       (t) => chalk.bgGreen.black.bold(` ${t} `),
  API:      (t) => chalk.bgYellow.black.bold(` ${t} `),
  ERROR:    (t) => chalk.bgRed.white.bold(` ${t} `),
  WARN:     (t) => chalk.bgYellow.black.bold(` ${t} `),
  SERVER:   (t) => chalk.bgCyanBright.black.bold(` ${t} `),
  WEBHOOK:  (t) => chalk.bgMagentaBright.black.bold(` ${t} `),
  AI:       (t) => chalk.bgYellowBright.black.bold(` ${t} `),
  CRON:     (t) => chalk.bgHex('#FFA500').black.bold(` ${t} `), // Orange untuk Cron
};

/**
 * Gradient presets kustom untuk berbagai mood visual:
 * - cyber: futuristik, untuk banner utama
 * - neon: eye-catching, untuk pesan sukses
 * - sunset: hangat, untuk peringatan
 */
const GRADIENTS = {
  cyber:   gradient(['#00f2fe', '#4facfe', '#a855f7']),
  sunset:  gradient(['#fa709a', '#fee140']),
  ocean:   gradient(['#667eea', '#764ba2']),
  neon:    gradient(['#f093fb', '#f5576c', '#4facfe']),
  emerald: gradient(['#11998e', '#38ef7d']),
};

/**
 * Timestamp — format 24 jam lokal Indonesia.
 * Ditempel di setiap baris agar developer tahu urutan kronologis event.
 */
const getTimestamp = (): string => {
  return chalk.gray(`[${new Date().toLocaleTimeString('id-ID', { hour12: false })}]`);
};

/**
 * Format tag dengan fixed-width padding agar semua baris log rata kiri.
 */
const formatTag = (tag: LogTag): string => {
  const padded = tag.padEnd(8);
  return TAG_STYLES[tag]?.(padded) ?? chalk.gray(` ${padded} `);
};

// ═══════════════════════════════════════════════════════
// LOGGER CLASS — Singleton Pattern
// ═══════════════════════════════════════════════════════

class Logger {
  /** Log informasi umum — event standar non-kritis */
  info(tag: LogTag, message: string): void {
    console.log(`  ${getTimestamp()} ${formatTag(tag)} ${chalk.white('▸')} ${chalk.white(message)}`);
  }

  /** Log keberhasilan — feedback positif bahwa proses sukses */
  success(tag: LogTag, message: string): void {
    console.log(`  ${getTimestamp()} ${formatTag(tag)} ${chalk.green('✔')} ${chalk.greenBright(message)}`);
  }

  /** Log peringatan — situasi tidak fatal tapi perlu perhatian */
  warn(tag: LogTag, message: string): void {
    console.log(`  ${getTimestamp()} ${formatTag(tag)} ${chalk.yellow('⚠')} ${chalk.yellowBright(message)}`);
  }

  /** Log error — situasi kritis, opsional menerima object error */
  error(tag: LogTag, message: string, err?: unknown): void {
    console.log(`  ${getTimestamp()} ${formatTag('ERROR')} ${chalk.red('✖')} ${chalk.redBright(message)}`);
    if (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.log(`${' '.repeat(28)}${chalk.gray('└─')} ${chalk.red(errorMessage)}`);
    }
  }

  /**
   * Tampilkan ASCII Banner megah (Figlet + Gradient)
   * First impression penting — developer harus tahu ini project serius.
   */
  banner(text: string, subtitle?: string): void {
    const asciiArt = figlet.textSync(text, {
      font: 'ANSI Shadow',
      horizontalLayout: 'fitted',
    });

    const styledBanner = GRADIENTS.cyber.multiline(asciiArt);

    console.log(
      boxen(styledBanner, {
        padding: { top: 1, bottom: 1, left: 2, right: 2 },
        margin: { top: 1, bottom: 0, left: 1, right: 1 },
        borderStyle: 'double',
        borderColor: 'cyan',
        title: subtitle ? chalk.bold(subtitle) : undefined,
        titleAlignment: 'center',
      })
    );
  }

  /** Panel informasi — kotak cantik untuk ringkasan atau tips */
  panel(title: string, content: string, color: string = 'cyan'): void {
    console.log(
      boxen(content, {
        padding: 1,
        margin: { top: 1, bottom: 1, left: 1, right: 1 },
        borderStyle: 'round',
        borderColor: color,
        title: ` ${title} `,
        titleAlignment: 'center',
      })
    );
  }

  /** Spinner loading dots12 — mengembalikan instance Ora untuk kontrol */
  spinner(tag: LogTag, message: string): Ora {
    return ora({
      text: `  ${getTimestamp()} ${formatTag(tag)} ${chalk.white('▸')} ${chalk.cyanBright(message)}`,
      spinner: 'dots12',
      color: 'cyan',
    }).start();
  }

  /** Separator visual antar section */
  divider(): void {
    console.log(chalk.gray('\n  ' + '─'.repeat(56) + '\n'));
  }

  /** Akses ke gradient presets untuk kebutuhan custom */
  gradient = GRADIENTS;
}

// Export singleton instance
export const log = new Logger();
