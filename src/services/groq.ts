/**
 * ╔══════════════════════════════════════════════════════╗
 * ║  GROQ AI SERVICE — Pesan Commit Jadi Laporan Kece   ║
 * ╠══════════════════════════════════════════════════════╣
 * ║  Menghubungkan aplikasi ke Groq LPU API yang super  ║
 * ║  cepat. Tugas utamanya adalah merapikan pesan       ║
 * ║  commit teknis menjadi laporan progress yang mudah  ║
 * ║  dipahami klien di grup WhatsApp.                   ║
 * ╚══════════════════════════════════════════════════════╝
 */

import Groq from 'groq-sdk';
import { log } from '../utils/logger.js';

// Inisialisasi Groq client (akan otomatis mengambil GROQ_API_KEY dari .env)
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

/**
 * formatCommitMessage() — Merapikan commit GitHub via AI
 *
 * @param pusherName Nama user GitHub yang melakukan push
 * @param repoName Nama repositori GitHub
 * @param commitsArray Array daftar pesan commit
 * @returns String laporan yang sudah dirapikan, atau pesan error fallback
 */
export async function formatCommitMessage(
  pusherName: string,
  repoName: string,
  commitsArray: string[]
): Promise<string> {
  // Jika tidak ada API key, kembalikan format standar saja
  if (!process.env.GROQ_API_KEY) {
    log.warn('AI', 'GROQ_API_KEY tidak diset. Menggunakan format standar.');
    return `📦 *Pembaruan: ${repoName}*\n\nOleh: ${pusherName}\n\nPerubahan:\n${commitsArray.map(c => `- ${c}`).join('\n')}`;
  }

  const prompt = `
Berikut adalah data pembaruan proyek (push ke repository GitHub):
- Repositori: ${repoName}
- Oleh: ${pusherName}
- Daftar Commit:
${commitsArray.map(c => `- ${c}`).join('\n')}
`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'Kamu adalah AI Project Manager yang cerdas. Rapikan pesan commit GitHub ini menjadi laporan pembaruan proyek yang sangat profesional, ramah, dan mudah dipahami oleh klien (non-teknis). Gunakan listicle, bold, italic, dan emoji yang relevan. Jangan ubah makna teknisnya, tapi buat bahasa penyampaiannya keren. Jangan sapa dan langsung berikan isinya.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      // Llama-3-8b sangat cocok: Cepat dan reasoning-nya bagus untuk task sederhana
      model: 'llama3-8b-8192',
      temperature: 0.5,
    });

    const aiMessage = completion.choices[0]?.message?.content;
    
    if (!aiMessage) {
      throw new Error('AI tidak mengembalikan pesan.');
    }

    return aiMessage.trim();

  } catch (error) {
    log.error('AI', 'Gagal memformat pesan commit.', error);
    // Fallback: Kirim format standar jika AI error/rate limit
    return `📦 *Pembaruan: ${repoName}*\n\nOleh: ${pusherName}\n\nPerubahan:\n${commitsArray.map(c => `- ${c}`).join('\n')}`;
  }
}

/**
 * analyzeDocument() — AI Project Manager Reviewer (SOW/Proposal)
 *
 * Menganalisis dokumen proyek dan mencari celah bisnis/teknis
 * agar scope kerja (SOW) lebih jelas.
 *
 * @param documentText Teks mentah dari Google Docs
 * @param projectName Nama proyek
 * @returns String hasil evaluasi
 */
export async function analyzeDocument(documentText: string, projectName: string): Promise<string> {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY belum dikonfigurasi. Fitur AI tidak dapat digunakan.');
  }

  // Karena dokumen bisa sangat panjang, kita akan membatasi panjang teks yang dikirim
  // agar tidak melebihi konteks limit Llama 3 (sekitar ~8000 tokens)
  const safeDocumentText = documentText.substring(0, 15000); // Ambil 15000 karakter pertama saja

  const prompt = `
Nama Proyek: ${projectName}

Isi Dokumen (SOW/Proposal):
"""
${safeDocumentText}
"""
`;

  log.info('AI', `Memulai analisis dokumen untuk proyek: ${projectName}...`);

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'Kamu adalah Senior Project Manager dan Analis Sistem yang sangat teliti. Analisis dokumen Proposal/SOW berikut. Carilah celah, ambiguitas, atau hal yang kurang spesifik (misal: fitur yang tidak dijelaskan detailnya, alur yang bolong). Berikan tepat 3 poin evaluasi kritis yang membangun. Gunakan bahasa Indonesia yang profesional, tegas, tapi asik (ala startup). Gunakan formatting WhatsApp (tebal, miring, emoji). Sapa tim dan sebutkan nama proyeknya di awal.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      // Menggunakan Llama-3 karena kapabilitas penalaran logikanya unggul
      model: 'llama3-8b-8192',
      temperature: 0.3, // Lebih rendah = lebih logis dan tidak berhalusinasi
    });

    const aiMessage = completion.choices[0]?.message?.content;
    
    if (!aiMessage) {
      throw new Error('AI tidak mengembalikan pesan.');
    }

    log.success('AI', 'Analisis dokumen selesai.');
    return aiMessage.trim();

  } catch (error) {
    log.error('AI', 'Gagal menganalisis dokumen.', error);
    throw error;
  }
}

/**
 * generateDailyReminder() — AI Scrum Master (Daily Reminder)
 *
 * Meng-generate pesan motivasi pagi yang disesuaikan dengan kondisi proyek.
 *
 * @param projectName Nama Proyek
 * @param daysRemaining Sisa hari menuju deadline
 * @param isFigmaMissing Apakah figmaUrl kosong?
 * @param isDocsMissing Apakah docsUrl kosong?
 * @returns String pesan pengingat
 */
export async function generateDailyReminder(
  projectName: string,
  daysRemaining: number,
  isFigmaMissing: boolean,
  isDocsMissing: boolean
): Promise<string> {
  if (!process.env.GROQ_API_KEY) {
    // Fallback jika API Key kosong
    return `☀️ *Daily Scrum: ${projectName}*\n\nSelamat pagi tim! Deadline tinggal *${daysRemaining} hari* lagi. Mari selesaikan tugas hari ini dengan maksimal! 🚀`;
  }

  const prompt = `
Status Proyek:
- Nama: ${projectName}
- Sisa Waktu Deadline: ${daysRemaining} hari
- Status Desain (Figma): ${isFigmaMissing ? 'KOSONG / BELUM ADA' : 'Ada'}
- Status Dokumen (SOW): ${isDocsMissing ? 'KOSONG / BELUM ADA' : 'Ada'}
`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'Kamu adalah Scrum Master yang asik dan memotivasi di sebuah Tech Startup. Buatkan pesan pengingat pagi (Daily Scrum) untuk tim di WhatsApp. Sapa tim dengan semangat. Beritahu mereka sisa harinya. Jika Figma atau Dokumen masih kosong (berdasarkan data yang diberikan), ingatkan secara santai tapi tegas untuk segera dilengkap. Gunakan emoji penyemangat dan bahasa gaul startup (contoh: "Yuk gas!", "Semangat tim!", "Jangan lupa sync", dll). Jangan buat terlalu panjang (maksimal 4 paragraf pendek). Langsung berikan isinya tanpa sapaan pembuka "Tentu, ini dia pesanannya...".'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      // Llama 3 8B cukup ringan dan cepat untuk task generasi teks natural
      model: 'llama3-8b-8192',
      temperature: 0.7, // Sedikit lebih tinggi agar bahasanya lebih luwes dan bervariasi setiap hari
    });

    const aiMessage = completion.choices[0]?.message?.content;
    
    if (!aiMessage) {
      throw new Error('AI tidak mengembalikan pesan.');
    }

    return aiMessage.trim();

  } catch (error) {
    log.error('AI', 'Gagal membuat pesan daily reminder.', error);
    return `☀️ *Daily Scrum: ${projectName}*\n\nSelamat pagi tim! Deadline tinggal *${daysRemaining} hari* lagi. Mari selesaikan tugas hari ini dengan maksimal! 🚀`;
  }
}
