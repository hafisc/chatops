/**
 * ╔══════════════════════════════════════════════════════╗
 * ║  DATABASE CONFIG — Prisma v6 + SQLite               ║
 * ╠══════════════════════════════════════════════════════╣
 * ║  Mengelola koneksi database menggunakan Prisma ORM  ║
 * ║  dengan SQLite — ringan, portable, zero-config.     ║
 * ║                                                      ║
 * ║  Mengapa SQLite dan bukan PostgreSQL?               ║
 * ║  Karena ChatOps bot tidak butuh server DB terpisah. ║
 * ║  SQLite cukup kuat untuk use-case ini, dan bisa     ║
 * ║  di-deploy bahkan di Raspberry Pi.                  ║
 * ╚══════════════════════════════════════════════════════╝
 */

import { PrismaClient } from '@prisma/client';
import { log } from '../utils/logger.js';

// Singleton — satu koneksi database untuk seluruh aplikasi
const prisma = new PrismaClient({
  log: ['warn', 'error'],
});

/**
 * connectDB() — Test koneksi awal ke database SQLite
 *
 * Prinsip fail-fast: jika database bermasalah,
 * lebih baik ketahuan saat startup daripada crash di runtime.
 */
export async function connectDB(): Promise<void> {
  try {
    // $queryRaw memaksa koneksi terbuka sekarang juga
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    log.error('DB', 'Gagal terhubung ke database SQLite.', error);
    throw error;
  }
}

/**
 * disconnectDB() — Menutup koneksi database dengan aman
 * Dipanggil saat graceful shutdown untuk mencegah data corruption.
 */
export async function disconnectDB(): Promise<void> {
  await prisma.$disconnect();
  log.info('DB', 'Koneksi database ditutup dengan aman.');
}

export { prisma };
