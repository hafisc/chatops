/**
 * ╔══════════════════════════════════════════════════════╗
 * ║  DOC SCRAPER UTILITY — Light & Fast                 ║
 * ╠══════════════════════════════════════════════════════╣
 * ║  Mengambil konten teks murni dari Google Docs tanpa ║
 * ║  menggunakan headless browser. Sangat hemat RAM     ║
 * ║  dan memiliki waktu eksekusi < 1 detik.            ║
 * ╚══════════════════════════════════════════════════════╝
 */

import { log } from './logger.js';

/**
 * fetchGoogleDocText() — Ekstrak teks murni dari GDocs
 * 
 * @param url Link Google Docs (harus memiliki akses "Anyone with the link")
 * @returns String teks murni dari dokumen
 */
export async function fetchGoogleDocText(url: string): Promise<string> {
  try {
    // Memastikan URL valid
    const parsedUrl = new URL(url);
    
    if (!parsedUrl.hostname.includes('docs.google.com')) {
      throw new Error('URL bukan dokumen Google Docs.');
    }

    // Trik efisiensi tinggi: Ubah /edit... menjadi /export?format=txt
    // Ini langsung men-download dokumen sebagai teks biasa, tanpa memuat HTML/CSS/JS Google
    const exportUrl = url.replace(/\/edit.*$/, '/export?format=txt');
    
    log.info('API', `Mengunduh teks dokumen dari: ${exportUrl}`);
    
    // Gunakan Native Fetch (Node.js >= 18)
    const response = await fetch(exportUrl);

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error('Dokumen diprivate. Harap ubah akses menjadi "Anyone with the link".');
      }
      if (response.status === 404) {
        throw new Error('Dokumen tidak ditemukan atau link salah.');
      }
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const text = await response.text();
    
    // Beberapa dokumen mungkin kosong atau terlalu pendek
    if (!text || text.trim().length < 10) {
      throw new Error('Dokumen kosong atau teks terlalu pendek untuk dianalisis.');
    }

    log.success('API', 'Berhasil mengekstrak teks Google Docs.');
    return text.trim();

  } catch (error: any) {
    log.error('API', 'Gagal memproses URL Google Docs.', error);
    throw error;
  }
}
