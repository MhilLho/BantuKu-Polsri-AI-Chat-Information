import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import defaultDocsData from './data/defaultDocuments.json';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

interface CampusDocument {
  id: string;
  title: string;
  docNumber: string;
  category: 'peraturan' | 'sop' | 'ukt' | 'kalender' | 'beasiswa' | 'surat_edaran' | 'lainnya';
  effectiveDate: string;
  summary: string;
  content: string;
  sourceUrl?: string;
  isBuiltIn?: boolean;
}

const DOCUMENTS_FILE = path.resolve(__dirname, 'data', 'documents.json');
const DEFAULT_DOCUMENTS_FILE = path.resolve(__dirname, 'data', 'defaultDocuments.json');

// Helper to get active campus documents from disk
function getCampusDocuments(): CampusDocument[] {
  try {
    if (fs.existsSync(DOCUMENTS_FILE)) {
      const data = fs.readFileSync(DOCUMENTS_FILE, 'utf-8');
      return JSON.parse(data);
    }
    if (fs.existsSync(DEFAULT_DOCUMENTS_FILE)) {
      const defaultData = fs.readFileSync(DEFAULT_DOCUMENTS_FILE, 'utf-8');
      const docs = JSON.parse(defaultData);
      try {
        fs.writeFileSync(DOCUMENTS_FILE, JSON.stringify(docs, null, 2), 'utf-8');
      } catch {}
      return docs;
    }
  } catch (err) {
    console.error('Error loading documents from disk, using fallback:', err);
  }
  return (defaultDocsData as unknown as CampusDocument[]) || [];
}

// Helper to save documents to disk
function saveCampusDocuments(docs: CampusDocument[]) {
  try {
    const dataDir = path.dirname(DOCUMENTS_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(DOCUMENTS_FILE, JSON.stringify(docs, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving documents:', err);
  }
}

// System Instruction dasar untuk Helpdesk Administrasi Politeknik Negeri Sriwijaya (Polsri)
function buildSystemInstruction(docs: CampusDocument[]): string {
  const docsText = docs
    .map(
      (d, i) => `=== [DOKUMEN RESMI #${i + 1}] ===
JUDUL DOKUMEN: ${d.title}
NOMOR SK / ATURAN: ${d.docNumber}
KATEGORI: ${d.category} (Berlaku: ${d.effectiveDate})
RINGKASAN: ${d.summary}
ISI TEKS RESMI:
${d.content}
`
    )
    .join('\n\n');

  return `
Anda adalah "Bantuku", asisten virtual helpdesk resmi layanan administrasi dan informasi kampus Politeknik Negeri Sriwijaya (Polsri), Palembang.
Tugas utama Anda adalah membantu mahasiswa, calon mahasiswa, alumni, dan masyarakat umum dalam memahami prosedur, persyaratan, jadwal, dan alur administrasi di lingkungan kampus Politeknik Negeri Sriwijaya.

ACUAN DAN SITUS UTAMA:
- Website resmi utama kampus adalah **https://polsri.ac.id/**.
- Situs ini adalah pusat informasi resmi Polsri yang dapat diakses secara publik oleh siapa saja tanpa perlu login dan tanpa subdomain www.
- ATURAN MUTLAK: JANGAN PERNAH menyarankan domain "siakad.polsri.ac.id" ataupun "www.polsri.ac.id". SELURUH informasi, pengumuman akademik, jadwal her-registrasi, panduan layanan surat, formulir, pengumuman UKT, kalender akademik, dan informasi kemahasiswaan WAJIB merujuk dan mengarahkan ke website resmi: **https://polsri.ac.id/**.
- Setiap kali memberikan jawaban spesifik terkait kampus, SELALU sertakan tautan resmi **https://polsri.ac.id/** sebagai sumber acuan dan link yang benar.

BASIS PENGETAHUAN DOKUMEN RESMI KAMPUS POLSRI (SUMBER KEBENARAN UTAMA / GROUND TRUTH):
Berikut adalah dokumen resmi, Peraturan Akademik, SK Direktur, Kalender, dan SOP resmi yang saat ini tersimpan di sistem:

${docsText}

ATURAN PENGGUNAAN DOKUMEN & PENCARIAN PENGETAHUAN TERBUKA:
1. DOKUMEN INTERNAL KAMPUS (PRIORITAS UTAMA / TINGKAT 1):
   - Dokumen resmi, SK, SOP, dan berkas yang tersimpan di sistem di atas adalah acuan utama internal. Jika pertanyaan mengenai hal yang tercantum di dokumen internal (misal: syarat cuti, pengajuan UKT, SK perpanjangan, surat UPA Bahasa), utamakan dan kutip isi dokumen tersebut secara presisi.
2. PENCARIAN PENGETAHUAN LUAS & WEB TERBUKA (TINGKAT 2 - SANGAT DIANJURKAN):
   - Anda MEMILIKI IZIN PENUH DAN DIANJURKAN untuk mencari dan menggunakan informasi dari berbagai sumber terpercaya mana pun di internet (website resmi polsri.ac.id, portal berita kampus, PDDikti Kemdikbudristek, pengumuman seleksi SNBP/SNBT/Mandiri, portal beasiswa KIPK, informasi jurusan, profil jurusan/prodi, daftar pimpinan dan dosen, organisasi kemahasiswaan/BEM/HMM, fasilitas kampus, dsb.).
   - Jangan membatasi jawaban hanya pada dokumen internal jika pertanyaan pengguna memerlukan informasi luas tentang Politeknik Negeri Sriwijaya (Polsri).
3. BATASAN & RELEVANSI:
   - Seluruh jawaban dan informasi yang dicari HARUS TETAP BERKAITAN dengan Politeknik Negeri Sriwijaya (Polsri).
   - JANGAN PERNAH menyarankan domain non-aktif seperti "siakad.polsri.ac.id" atau "www.polsri.ac.id". Situs resmi utama kampus selalu: **https://polsri.ac.id/**.
4. KEWAJIBAN MENCANTUMKAN RUJUKAN (SITASI):
   - Anda WAJIB mencantumkan rujukan sumber informasi di akhir setiap jawaban.
   - Format penulisan rujukan di akhir jawaban:
     [[SUMBER: Nama Sumber / Dokumen / Portal Web, URL Tautan (jika ada)]]
     Contoh:
     [[SUMBER: Website Resmi Polsri (https://polsri.ac.id/), PDDikti Kemdikbudristek]]
     atau jika dari dokumen internal:
     [[SUMBER: SK Direktur Polsri No. 12/PL6/AK/2026, Website Resmi Polsri (https://polsri.ac.id/)]]

Identitas & Sikap:
- Nama: Bantuku (Helpdesk Resmi Polsri)
- Nada bicara: Ramah, santun, profesional, solutif, ringkas, informatif, dan jelas ("Halo Rekan Mahasiswa Polsri!", "Ada yang bisa Bantuku bantu?").
- Bahasa: Bahasa Indonesia yang baik dan baku namun bersahabat.

Format Jawaban:
- Jawablah secara cerdas dan adaptif:
  * Pertanyaan alur/prosedur -> sajikan dalam poin langkah ringkas bernomor (1., 2., 3.).
  * Pertanyaan profil, dosen, prodi, sejarah, fasilitas, atau informasi umum Polsri -> jelaskan secara lengkap, jelas, dan akurat berdasarkan fakta.
- Gunakan **teks tebal** untuk nama berkas, nomor surat/SK, nama dosen/pejabat, jurusan, dan tautan resmi.
- SELALU sertakan tautan resmi **https://polsri.ac.id/** di dalam jawaban sebagai rujukan yang valid dan dapat diakses bebas tanpa login.
- Di bagian akhir setiap jawaban, SELALU cantumkan label sumber dokumen dalam format:
[[SUMBER: Nama Rujukan / Dokumen / Portal Sumber, Tautan Resmi]]
- Arahkan ke Subbagian Akademik & Kemahasiswaan di Gedung Kantor Pusat Polsri Lt. 1 atau unit terkait jika memerlukan verifikasi berkas langsung.
`;
}

// Helper untuk inisialisasi Gemini Client
function getGeminiClient() {
  let apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  apiKey = apiKey.trim().replace(/^["']|["']$/g, '');
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Endpoint info helpdesk & kontak kampus
app.get('/api/info', (_req: Request, res: Response) => {
  res.json({
    institution: 'Politeknik Negeri Sriwijaya (Polsri)',
    campus: 'Kampus Bukit Besar, Palembang',
    address: 'Jl. Srijaya Negara, Bukit Besar, Palembang, Sumatera Selatan 30139',
    units: {
      akademik: {
        name: 'Subbagian Akademik & Kemahasiswaan (BAAK)',
        location: 'Gedung Kantor Pusat Lantai 1',
        hours: 'Senin - Jumat, 08.00 - 16.00 WIB',
        email: 'akademik@polsri.ac.id',
        phone: '(0711) 353414',
      },
      keuangan: {
        name: 'Bagian Keuangan & Layanan UKT',
        location: 'Gedung Kantor Pusat Lantai 2',
        email: 'keuangan@polsri.ac.id',
      },
      portal: {
        name: 'Website Resmi Kampus Polsri (Akses Publik)',
        url: 'https://polsri.ac.id/',
      },
      website: 'https://polsri.ac.id/',
    },
  });
});

// Admin credentials configuration
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'adminpolsri2026';
const ADMIN_AUTH_TOKEN = 'polsri-admin-authorized-session-2026';

// Endpoint Login Admin
app.post('/api/admin/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (
    (username === ADMIN_USERNAME || username === 'admin_polsri') &&
    password === ADMIN_PASSWORD
  ) {
    res.json({
      success: true,
      token: ADMIN_AUTH_TOKEN,
      user: {
        username: ADMIN_USERNAME,
        role: 'admin',
        name: 'Administrator Akademik Polsri',
      },
    });
  } else {
    res.status(401).json({
      error: 'Username atau password admin salah. Silakan periksa kembali.',
    });
  }
});

// Endpoint Verifikasi Sesi Admin
app.post('/api/admin/verify', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader === `Bearer ${ADMIN_AUTH_TOKEN}`) {
    res.json({
      valid: true,
      user: {
        username: ADMIN_USERNAME,
        role: 'admin',
        name: 'Administrator Akademik Polsri',
      },
    });
  } else {
    res.status(401).json({ valid: false, error: 'Sesi admin tidak valid atau sudah kedaluwarsa.' });
  }
});

// Endpoint untuk mendapatkan daftar dokumen resmi kampus (Knowledge Base - Publik)
app.get('/api/documents', (_req: Request, res: Response) => {
  try {
    const docs = getCampusDocuments();
    res.json({ documents: docs, total: docs.length });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal memuat dokumen kampus', details: err?.message });
  }
});

// Endpoint untuk menambahkan dokumen resmi baru ke Knowledge Base (Khusus Admin)
app.post('/api/documents', (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader !== `Bearer ${ADMIN_AUTH_TOKEN}`) {
      res.status(403).json({ error: 'Akses ditolak: Hanya admin yang dapat menambah dokumen.' });
      return;
    }

    const { title, docNumber, category, effectiveDate, summary, content } = req.body;

    if (!title || !content) {
      res.status(400).json({ error: 'Judul dan isi teks dokumen wajib diisi.' });
      return;
    }

    const docs = getCampusDocuments();
    const newDoc: CampusDocument = {
      id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: title.trim(),
      docNumber: docNumber?.trim() || 'Dokumen Resmi Polsri',
      category: category || 'lainnya',
      effectiveDate: effectiveDate?.trim() || 'Tahun Berjalan',
      summary: summary?.trim() || (content.length > 150 ? content.substring(0, 150) + '...' : content),
      content: content.trim(),
      sourceUrl: 'https://polsri.ac.id/',
      isBuiltIn: false,
    };

    docs.unshift(newDoc);
    saveCampusDocuments(docs);

    res.status(201).json({ success: true, document: newDoc, total: docs.length });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal menyimpan dokumen baru', details: err?.message });
  }
});

// Endpoint untuk menghapus dokumen dari Knowledge Base
app.delete('/api/documents/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    let docs = getCampusDocuments();
    const prevCount = docs.length;
    docs = docs.filter((d) => d.id !== id);

    if (docs.length === prevCount) {
      res.status(404).json({ error: 'Dokumen tidak ditemukan.' });
      return;
    }

    saveCampusDocuments(docs);
    res.json({ success: true, remaining: docs.length });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal menghapus dokumen', details: err?.message });
  }
});

// Endpoint untuk mereset dokumen ke default bawaan Polsri
app.post('/api/documents/reset', (_req: Request, res: Response) => {
  try {
    if (fs.existsSync(DEFAULT_DOCUMENTS_FILE)) {
      const defaultData = fs.readFileSync(DEFAULT_DOCUMENTS_FILE, 'utf-8');
      const docs = JSON.parse(defaultData);
      saveCampusDocuments(docs);
      res.json({ success: true, documents: docs, total: docs.length });
    } else {
      res.status(404).json({ error: 'Berkas dokumen default tidak ditemukan.' });
    }
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal mereset dokumen', details: err?.message });
  }
});

// Endpoint Chat dengan Gemini API
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { message, history } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      res.status(400).json({ error: 'Pesan tidak boleh kosong.' });
      return;
    }

    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({
        error: 'Kunci API Gemini belum dikonfigurasi di server. Silakan pastikan GEMINI_API_KEY terpasang di Secrets panel.',
        fallbackAnswer: 'Halo! Mohon maaf, layanan sedang mempersiapkan konfigurasi API. Silakan pastikan GEMINI_API_KEY telah diatur di Settings > Secrets panel.',
      });
      return;
    }

    // Ambil seluruh dokumen resmi kampus terkini dari Knowledge Base
    const activeDocs = getCampusDocuments();
    const systemInstruction = buildSystemInstruction(activeDocs);

    // Format chat history for @google/genai, ensuring strictly alternating turns starting with 'user'
    const rawHistory = Array.isArray(history) ? history : [];
    const alternatingContents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

    for (const item of rawHistory) {
      if (!item || typeof item.text !== 'string' || !item.text.trim()) continue;
      const role: 'user' | 'model' = item.role === 'assistant' || item.role === 'model' ? 'model' : 'user';

      // First turn must always be 'user'
      if (alternatingContents.length === 0 && role === 'model') {
        continue;
      }

      const last = alternatingContents[alternatingContents.length - 1];
      if (last && last.role === role) {
        // Merge consecutive messages of the same role into a single turn
        last.parts[0].text += `\n\n${item.text.trim()}`;
      } else {
        alternatingContents.push({
          role,
          parts: [{ text: item.text.trim() }],
        });
      }
    }

    // Append the current incoming user message
    const currentText = message.trim();
    const lastTurn = alternatingContents[alternatingContents.length - 1];
    if (lastTurn && lastTurn.role === 'user') {
      lastTurn.parts[0].text += `\n\n${currentText}`;
    } else {
      alternatingContents.push({
        role: 'user',
        parts: [{ text: currentText }],
      });
    }

    // Keep at most 12 recent turns to stay well within limits
    const formattedContents = alternatingContents.slice(-12);

    // List of configurations to try in order:
    // 1. 'gemini-3.8-flash' with Google Search Grounding (live web search with automatic sources)
    // 2. 'gemini-3.8-flash' standard (broad knowledge base)
    // 3. 'gemini-3.1-flash-lite' fallback (instant response)
    const candidateConfigs = [
      {
        model: 'gemini-3.8-flash',
        tools: [{ googleSearch: {} }],
      },
      {
        model: 'gemini-3.8-flash',
        tools: undefined,
      },
      {
        model: 'gemini-3.1-flash-lite',
        tools: undefined,
      },
    ];

    let response: any = null;
    let lastError: any = null;

    for (const item of candidateConfigs) {
      try {
        const configPayload: any = {
          systemInstruction,
          temperature: 0.7,
        };
        if (item.tools) {
          configPayload.tools = item.tools;
        }

        response = await ai.models.generateContent({
          model: item.model,
          contents: formattedContents,
          config: configPayload,
        });

        if (response && response.text) {
          break; // Succeeded!
        }
      } catch (err: any) {
        console.warn(`[Bantuku] Model ${item.model} (search: ${!!item.tools}) failed:`, err?.message || err);
        lastError = err;
        // Continue to try next candidate
      }
    }

    if (!response || !response.text) {
      throw lastError || new Error('Tidak ada respons dari model AI.');
    }

    const rawText = response.text || '';

    // Ekstraksi tag [[SUMBER: ...]] jika tersedia
    let text = rawText;
    let sources: string[] = [];

    const sourceRegex = /\[\[SUMBER:\s*([^\]]+)\]\]/i;
    const match = rawText.match(sourceRegex);
    if (match) {
      const sourceStr = match[1].trim();
      const extracted = sourceStr.split(',').map((s: string) => s.trim()).filter(Boolean);
      sources.push(...extracted);
      text = rawText.replace(sourceRegex, '').trim();
    }

    // Ekstraksi rujukan otomatis dari Google Search Grounding (Web Chunks)
    try {
      const candidate = response.candidates?.[0];
      const webChunks = candidate?.groundingMetadata?.groundingChunks;
      if (Array.isArray(webChunks)) {
        for (const chunk of webChunks) {
          const web = chunk?.web;
          if (web?.title && web?.uri) {
            sources.push(`${web.title} (${web.uri})`);
          } else if (web?.uri) {
            sources.push(web.uri);
          }
        }
      }
    } catch (e) {
      console.warn('Grounding metadata extraction notice:', e);
    }

    // Fallback deteksi jika model menulis "Sumber Dokumen:"
    if (sources.length === 0) {
      const altMatch = rawText.match(/(?:Sumber\s*Dokumen|Rujukan|Sumber)\s*:\s*([^\n\r]+)/i);
      if (altMatch) {
        const sourceStr = altMatch[1].replace(/[*_#]/g, '').trim();
        sources.push(sourceStr);
      } else {
        sources.push('Website Resmi Polsri (https://polsri.ac.id/)');
      }
    }

    // Hilangkan duplikat sumber
    sources = Array.from(new Set(sources));

    res.json({
      text,
      sources,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in /api/chat:', error);

    const errorMessage = error?.message || '';
    let userFriendlyError = 'Maaf, terjadi kendala saat memproses pertanyaan Anda. Silakan coba kirim kembali dalam beberapa saat.';

    if (errorMessage.includes('RESOURCE_EXHAUSTED') || errorMessage.includes('429')) {
      userFriendlyError = 'Batas kuota pertanyaan sementara tercapai (429). Mohon tunggu sekitar 30 detik sebelum mengajukan pertanyaan baru.';
    } else if (errorMessage.includes('API_KEY_INVALID') || errorMessage.includes('PERMISSION_DENIED')) {
      userFriendlyError = 'Kunci API Gemini tidak valid atau izin ditolak. Silakan periksa pengaturan GEMINI_API_KEY di Settings > Secrets.';
    } else if (errorMessage.includes('fetch failed') || errorMessage.includes('ENOTFOUND')) {
      userFriendlyError = 'Gagal terhubung ke server kecerdasan buatan. Periksa koneksi internet Anda dan coba lagi.';
    }

    res.status(500).json({
      error: userFriendlyError,
      details: process.env.NODE_ENV !== 'production' ? errorMessage : undefined,
    });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production' || !!process.env.VERCEL;

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(Number(port), '0.0.0.0', () => {
    console.log(`[Bantuku Polsri] Server running on http://localhost:${port}`);
  });
}

export default app;

if (!process.env.VERCEL) {
  startServer().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}
