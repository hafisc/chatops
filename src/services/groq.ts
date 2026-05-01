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
  const fallbackMessage = `🚀 *GITHUB UPDATE* 🚀
━━━━━━━━━━━━━━━━━━━━

📁 *Repo:*  \`${repoName}\`
👤 *Oleh:*  _${pusherName}_

📝 *Ringkasan Perubahan:*
${commitsArray.map(c => `> • ${c}`).join('\n')}

━━━━━━━━━━━━━━━━━━━━
_Terus semangat tim!_ 🔥`;

  // Jika tidak ada API key, kembalikan format standar saja
  if (!process.env.GROQ_API_KEY) {
    log.warn('AI', 'GROQ_API_KEY tidak diset. Menggunakan format standar.');
    return fallbackMessage;
  }

  const prompt = `
Data Pembaruan:
- Repo: ${repoName}
- User: ${pusherName}
- Commits: ${commitsArray.join(', ')}
`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'Kamu adalah Bot Notifikasi GitHub. Tugasmu: Ringkas commit menjadi laporan WhatsApp yang SANGAT RINGKAS dan PADAT. WAJIB ikuti struktur ini: Gunakan header "🚀 *GITHUB UPDATE* 🚀", garis pembatas "━━━━━━━━━━━━━━━━━━━━", lalu info Repo (gunakan monospace), Oleh (gunakan italic), dan Ringkasan Perubahan (WAJIB gunakan blockquote ">" untuk setiap poin). JANGAN gunakan kata-kata pembuka seperti "Tentu", "Berikut adalah", atau "Pada tanggal". JANGAN gunakan placeholder [tgl]. Langsung berikan hasil akhirnya sesuai struktur tersebut.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.2, // Rendah agar konsisten dan tidak kreatif berlebihan
    });

    const aiMessage = completion.choices[0]?.message?.content;

    if (!aiMessage) {
      throw new Error('AI tidak mengembalikan pesan.');
    }

    return aiMessage.trim();

  } catch (error) {
    log.error('AI', 'Gagal memformat pesan commit.', error);
    return fallbackMessage;
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
          content: 'Kamu adalah Senior Project Manager dan Analis Sistem elit. Analisis dokumen Proposal/SOW berikut. Carilah celah, ambiguitas, atau hal yang kurang spesifik. Berikan 3 poin evaluasi kritis. WAJIB gunakan format WhatsApp premium: gunakan header 📑 *SOW ANALYSIS* 📑 dan garis pembatas Unicode (━━━━━━━━━━━━━━━━━━━━). Gunakan Blockquote (>) untuk daftar evaluasi. Gunakan Monospace (\`\`\`) untuk istilah teknis. Buat sekeren dan serapi mungkin agar mudah dibaca di layar HP.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      // Menggunakan Llama-3 karena kapabilitas penalaran logikanya unggul
      model: 'llama-3.1-8b-instant',
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
  const fallbackMessage = `☀️ *DAILY SCRUM* ☀️
━━━━━━━━━━━━━━━━━━━━
🎯 *Proyek:* \`${projectName}\`
⏳ *Deadline:* _${daysRemaining} Hari Lagi_

> Mari selesaikan tugas hari ini dengan maksimal! 🚀
> Pastikan semua blocker sudah didiskusikan.

_Have a great day, team!_ 💪`;

  if (!process.env.GROQ_API_KEY) {
    // Fallback jika API Key kosong
    return fallbackMessage;
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
          content: 'Kamu adalah Scrum Master yang asik di Tech Startup. Buatkan pesan Daily Scrum pagi untuk grup WhatsApp. WAJIB gunakan format premium: header ☀️ *DAILY SCRUM* ☀️ dan garis (━━━━━━━━━━━━━━━━━━━━). Gunakan Blockquote (>) untuk poin-poin penting / pengingat dokumen yang kurang. Gunakan Bold (*) untuk teks penting. Sapa tim dengan semangat ala anak startup. Singkat, padat, dan estetis. Jangan pakai kata pembuka basa-basi dari AI.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      // Llama 3 8B cukup ringan dan cepat untuk task generasi teks natural
      model: 'llama-3.1-8b-instant',
      temperature: 0.7, // Sedikit lebih tinggi agar bahasanya lebih luwes dan bervariasi setiap hari
    });

    const aiMessage = completion.choices[0]?.message?.content;

    if (!aiMessage) {
      throw new Error('AI tidak mengembalikan pesan.');
    }

    return aiMessage.trim();

  } catch (error) {
    log.error('AI', 'Gagal membuat pesan daily reminder.', error);
    return fallbackMessage;
  }
}
