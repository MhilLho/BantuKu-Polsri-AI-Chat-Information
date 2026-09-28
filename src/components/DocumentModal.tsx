import React, { useState, useRef } from 'react';
import {
  X,
  FileText,
  BookOpen,
  Plus,
  Trash2,
  RotateCcw,
  CheckCircle2,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Upload,
  FileType,
  Loader2,
  AlertCircle,
  FileCheck2,
} from 'lucide-react';
import { CampusDocument } from '../types';
import { extractTextFromPdf } from '../utils/pdfExtractor';

interface DocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  documents: CampusDocument[];
  onAddDocument: (doc: Omit<CampusDocument, 'id' | 'isBuiltIn'>) => Promise<boolean>;
  onDeleteDocument: (id: string) => Promise<boolean>;
  onResetDocuments: () => Promise<boolean>;
  isLoading?: boolean;
  isAdminLoggedIn?: boolean;
  onOpenAdminModal?: () => void;
}

export const DocumentModal: React.FC<DocumentModalProps> = ({
  isOpen,
  onClose,
  documents,
  onAddDocument,
  onDeleteDocument,
  onResetDocuments,
  isLoading = false,
  isAdminLoggedIn = false,
  onOpenAdminModal,
}) => {
  const [activeTab, setActiveTab] = useState<'list' | 'add'>('list');
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [docNumber, setDocNumber] = useState('');
  const [category, setCategory] = useState<CampusDocument['category']>('peraturan');
  const [effectiveDate, setEffectiveDate] = useState('Tahun Berjalan');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // PDF Extraction State
  const [isExtractingPdf, setIsExtractingPdf] = useState(false);
  const [extractedPdfInfo, setExtractedPdfInfo] = useState<{
    fileName: string;
    numPages: number;
    charCount: number;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Smart detect metadata from text and filename
  const autoDetectMetadata = (fullText: string, fileName: string) => {
    const lowerText = (fullText + ' ' + fileName).toLowerCase();

    // 1. Detect Category
    let detectedCategory: CampusDocument['category'] = 'peraturan';
    if (lowerText.includes('ukt') || lowerText.includes('biaya kuliah') || lowerText.includes('tarif') || lowerText.includes('keringanan')) {
      detectedCategory = 'ukt';
    } else if (lowerText.includes('sop') || lowerText.includes('standar operasional') || lowerText.includes('prosedur layanan')) {
      detectedCategory = 'sop';
    } else if (lowerText.includes('kalender') || lowerText.includes('jadwal akademik') || lowerText.includes('kegiatan akademik')) {
      detectedCategory = 'kalender';
    } else if (lowerText.includes('beasiswa') || lowerText.includes('kip') || lowerText.includes('bantuan biaya')) {
      detectedCategory = 'beasiswa';
    } else if (lowerText.includes('edaran') || lowerText.includes('surat edaran')) {
      detectedCategory = 'surat_edaran';
    }
    setCategory(detectedCategory);

    // 2. Detect SK / Document Number
    const skMatch = fullText.match(/(?:Nomor|No\.?)\s*:\s*([0-9A-Za-z\/\.\-\_]+(?:\s+[0-9A-Za-z\/\.\-\_]+)?)/i) ||
                    fullText.match(/SK\s+Direktur\s+(?:Nomor|No\.?)\s*([0-9A-Za-z\/\.\-\_]+)/i);
    if (skMatch && skMatch[1]) {
      const cleanedSk = skMatch[1].replace(/[\n\r]/g, ' ').trim().slice(0, 50);
      if (cleanedSk.length > 3) {
        setDocNumber(`No. ${cleanedSk}`);
      }
    }

    // 3. Detect Academic Year / Semester
    const yearMatch = fullText.match(/(?:Tahun\s+Akademik|Tahun\s+Ajaran|Semester)\s+([0-9A-Za-z\/\s\-]+(?:202\d\/202\d|202\d))/i);
    if (yearMatch && yearMatch[1]) {
      setEffectiveDate(yearMatch[0].trim().slice(0, 40));
    }
  };

  // Process file (PDF or Text)
  const processUploadedFile = async (file: File) => {
    setStatusMessage(null);

    // If PDF file
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      try {
        setIsExtractingPdf(true);
        const result = await extractTextFromPdf(file);

        if (!result.text || result.text.trim().length === 0) {
          throw new Error('Teks dokumen PDF kosong atau berupa hasil scan gambar tanpa OCR.');
        }

        // Set form fields
        const cleanTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setTitle(cleanTitle);
        setContent(result.text);
        setSummary(result.summarySuggestion || result.text.slice(0, 150) + '...');
        autoDetectMetadata(result.text, file.name);

        setExtractedPdfInfo({
          fileName: file.name,
          numPages: result.numPages,
          charCount: result.text.length,
        });

        setStatusMessage({
          type: 'success',
          text: `File "${file.name}" berhasil diekstrak (${result.numPages} halaman). Tinjau data lalu klik tombol simpan.`,
        });
      } catch (err: any) {
        console.error('Error extracting PDF:', err);
        setStatusMessage({
          type: 'error',
          text: `Gagal membaca file PDF: ${err?.message || 'Pastikan file PDF dapat dibuka dan memuat teks digital.'}`,
        });
      } finally {
        setIsExtractingPdf(false);
      }
      return;
    }

    // If Text / Markdown file
    if (file.name.endsWith('.txt') || file.name.endsWith('.md')) {
      const cleanTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setTitle(cleanTitle);

      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          setContent(text);
          setSummary(text.slice(0, 150) + '...');
          autoDetectMetadata(text, file.name);
          setExtractedPdfInfo({
            fileName: file.name,
            numPages: 1,
            charCount: text.length,
          });
          setStatusMessage({
            type: 'success',
            text: `File "${file.name}" berhasil dimuat. Tinjau data lalu simpan.`,
          });
        }
      };
      reader.readAsText(file);
      return;
    }

    setStatusMessage({
      type: 'error',
      text: 'Format file tidak didukung. Mohon gunakan file berekstensi .pdf, .txt, atau .md.',
    });
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processUploadedFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setActiveTab('add');
      processUploadedFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setStatusMessage({ type: 'error', text: 'Judul dan isi teks dokumen wajib diisi.' });
      return;
    }

    setSubmitting(true);
    setStatusMessage(null);

    const success = await onAddDocument({
      title: title.trim(),
      docNumber: docNumber.trim() || 'Dokumen Resmi Polsri',
      category,
      effectiveDate: effectiveDate.trim() || 'Tahun Berjalan',
      summary: summary.trim() || (content.length > 150 ? content.slice(0, 150) + '...' : content),
      content: content.trim(),
      sourceUrl: 'https://polsri.ac.id/',
    });

    setSubmitting(false);

    if (success) {
      setStatusMessage({ type: 'success', text: 'Dokumen berhasil ditanamkan ke dalam memori AI Bantuku!' });
      setTitle('');
      setDocNumber('');
      setSummary('');
      setContent('');
      setExtractedPdfInfo(null);
      setTimeout(() => {
        setActiveTab('list');
        setStatusMessage(null);
      }, 1500);
    } else {
      setStatusMessage({ type: 'error', text: 'Gagal menyimpan dokumen. Silakan coba lagi.' });
    }
  };

  const getCategoryBadge = (cat: CampusDocument['category']) => {
    switch (cat) {
      case 'peraturan':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">Peraturan Akademik</span>;
      case 'ukt':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">SK Tarif & UKT</span>;
      case 'sop':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">SOP Layanan BAAK</span>;
      case 'kalender':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">Kalender Akademik</span>;
      case 'beasiswa':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">Beasiswa</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">Surat Edaran</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-geminiFadeIn">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#1E1F20] rounded-[24px] border border-[#E3E3E3] dark:border-[#2D2E30] shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E3E3E3] dark:border-[#2D2E30]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#1F1F1F] dark:text-[#E3E3E3]">
                  Basis Dokumen Resmi Kampus
                </h3>
                <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {documents.length} Dokumen Aktif
                </span>
              </div>
              <p className="text-xs text-[#5E5E5E] dark:text-[#8E8E8E]">
                Sumber kebenaran resmi (Ground Truth) yang dipedomani AI Bantuku
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-[#5E5E5E] dark:text-[#8E8E8E] hover:text-[#1F1F1F] dark:hover:text-[#E3E3E3] transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center justify-between px-6 pt-3 border-b border-[#E3E3E3] dark:border-[#2D2E30] bg-slate-50/50 dark:bg-white/[0.02]">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('list')}
              className={`px-4 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-colors cursor-pointer ${
                activeTab === 'list'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-[#1E1F20]'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Daftar Dokumen Resmi ({documents.length})
            </button>
            <button
              onClick={() => {
                if (onOpenAdminModal) {
                  onClose();
                  onOpenAdminModal();
                } else {
                  setActiveTab('add');
                }
              }}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer flex items-center gap-1.5"
              title="Khusus Staf / Admin BAAK Polsri"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload PDF (Khusus Admin)</span>
            </button>
          </div>

          <div className="flex items-center gap-2 pb-2">
            <button
              type="button"
              onClick={() => {
                if (onOpenAdminModal) {
                  onClose();
                  onOpenAdminModal();
                } else {
                  setActiveTab('add');
                }
              }}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <Upload className="w-3 h-3" />
              <span>Upload PDF (Admin)</span>
            </button>
            {isAdminLoggedIn && (
              <button
                onClick={async () => {
                  if (window.confirm('Reset dokumen kembali ke 5 Dokumen Resmi Standar Polsri?')) {
                    await onResetDocuments();
                  }
                }}
                className="text-[11px] text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-1 py-1 transition-colors cursor-pointer"
                title="Reset ke dokumen bawaan kampus"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Default</span>
              </button>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-4">
          {activeTab === 'list' ? (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-2.5 leading-relaxed">
                <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <strong>Basis Pengetahuan Tetap (Opsi B):</strong> Dokumen di bawah ini ditanam langsung ke sistem. Setiap mahasiswa mengajukan pertanyaan, AI Bantuku secara otomatis membaca dan mencocokkan pasal, SK, serta syarat dari dokumen ini.
                </div>
              </div>

              {documents.map((doc) => {
                const isExpanded = expandedDocId === doc.id;
                return (
                  <div
                    key={doc.id}
                    className="border border-[#E3E3E3] dark:border-[#2D2E30] rounded-2xl overflow-hidden bg-white dark:bg-[#1E1F20] transition-shadow hover:shadow-xs"
                  >
                    <div className="p-4 flex items-start justify-between gap-3">
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {getCategoryBadge(doc.category)}
                          <span className="text-[11px] text-slate-500 font-mono">
                            {doc.docNumber}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            • {doc.effectiveDate}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          {doc.title}
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          {doc.summary}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 pt-1">
                        <button
                          onClick={() => setExpandedDocId(isExpanded ? null : doc.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-xs flex items-center gap-1 font-medium"
                        >
                          <span>{isExpanded ? 'Tutup' : 'Lihat Teks'}</span>
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {!doc.isBuiltIn && (
                          <button
                            onClick={async () => {
                              if (window.confirm(`Hapus dokumen "${doc.title}"?`)) {
                                await onDeleteDocument(doc.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                            title="Hapus dokumen kustom"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-4 pb-4 pt-1 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-900/40 text-xs text-slate-700 dark:text-slate-300">
                        <div className="text-[11px] font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                          Isi Teks Dokumen Resmi (Diekstrak ke AI):
                        </div>
                        <pre className="whitespace-pre-wrap font-sans leading-relaxed bg-white dark:bg-[#1E1F20] p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-[11.5px] max-h-60 overflow-y-auto">
                          {doc.content}
                        </pre>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Direct PDF Upload Banner / Dropzone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-2xl p-5 text-center transition-all cursor-pointer ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/40 ring-4 ring-blue-500/20'
                    : 'border-blue-200 dark:border-blue-900/60 bg-gradient-to-b from-blue-50/50 to-white dark:from-blue-950/20 dark:to-[#1E1F20] hover:border-blue-400'
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt,.md"
                  onChange={handleFileInputChange}
                  className="hidden"
                />

                {isExtractingPdf ? (
                  <div className="py-4 flex flex-col items-center justify-center space-y-2.5">
                    <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Sedang Mengekstrak Teks dari File PDF...
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Membaca pasal, tabel, dan nomor halaman secara digital...
                      </p>
                    </div>
                  </div>
                ) : extractedPdfInfo ? (
                  <div className="py-2 flex items-center justify-between gap-3 text-left">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <FileCheck2 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate max-w-xs">
                            {extractedPdfInfo.fileName}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                            PDF Siap
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {extractedPdfInfo.numPages} Halaman • {extractedPdfInfo.charCount.toLocaleString()} Karakter diekstrak
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors"
                    >
                      Ganti File PDF
                    </button>
                  </div>
                ) : (
                  <div className="py-3 flex flex-col items-center justify-center space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Tarik & Lepas File PDF Dokumen Kampus di Sini
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        atau klik untuk memilih file PDF dari komputer / HP Anda
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10.5px] font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 shadow-2xs">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>Teks, nomor SK, dan ringkasan akan otomatis diisi ke formulir</span>
                    </div>
                  </div>
                )}
              </div>

              {statusMessage && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    statusMessage.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{statusMessage.text}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Judul Dokumen / Nama Panduan *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: SK Direktur tentang Biaya Praktikum 2024"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1E1F20] text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nomor SK / Aturan Resmi
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: SK Direktur No. 089/PL6/HK/2024"
                    value={docNumber}
                    onChange={(e) => setDocNumber(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1E1F20] text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Kategori Dokumen
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as CampusDocument['category'])}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1E1F20] text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-blue-500"
                  >
                    <option value="peraturan">Peraturan Akademik</option>
                    <option value="ukt">SK Tarif & Keringanan UKT</option>
                    <option value="sop">SOP Layanan BAAK/Kemahasiswaan</option>
                    <option value="kalender">Kalender Akademik</option>
                    <option value="beasiswa">Pedoman Beasiswa</option>
                    <option value="surat_edaran">Surat Edaran Direktur</option>
                    <option value="lainnya">Dokumen Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Masa Berlaku / Tahun
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Semester Ganjil 2024/2025"
                    value={effectiveDate}
                    onChange={(e) => setEffectiveDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1E1F20] text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Ringkasan Singkat (Poin Pokok)
                </label>
                <input
                  type="text"
                  placeholder="Ringkasan poin utama agar cepat dipahami"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1E1F20] text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Isi Teks Lengkap Dokumen (Hasil Ekstraksi PDF Otomatis) *
                  </label>
                  <span className="text-[10.5px] text-slate-400">
                    {content.length > 0 ? `${content.length.toLocaleString()} karakter` : 'Kosong'}
                  </span>
                </div>
                <textarea
                  required
                  rows={8}
                  placeholder="Teks dokumen PDF akan otomatis muncul di sini setelah Anda mengunggah file PDF. Anda juga dapat mengedit atau menambahkan catatan jika perlu..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1E1F20] text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-blue-500 leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting || isExtractingPdf}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50 shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Menyimpan...' : 'Tanamkan ke Memori AI'}</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#E3E3E3] dark:border-[#2D2E30] flex items-center justify-between text-xs text-slate-500 bg-slate-50/50 dark:bg-white/[0.01]">
          <span>Acuan tautan resmi tetap: <strong>https://polsri.ac.id/</strong></span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full text-xs font-semibold bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
