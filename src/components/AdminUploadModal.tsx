import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Shield,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  Upload,
  FileText,
  Trash2,
  RotateCcw,
  Sparkles,
  Loader2,
  FileCheck2,
  AlertCircle,
  LogOut,
  CheckCircle2,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
  Search,
} from 'lucide-react';
import { CampusDocument } from '../types';
import { extractTextFromPdf } from '../utils/pdfExtractor';

interface AdminUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  documents: CampusDocument[];
  onAddDocument: (doc: Omit<CampusDocument, 'id' | 'isBuiltIn'>) => Promise<boolean>;
  onDeleteDocument: (id: string) => Promise<boolean>;
  onResetDocuments: () => Promise<boolean>;
  isAdminLoggedIn: boolean;
  onAdminLogin: (token: string, username: string) => void;
  onAdminLogout: () => void;
}

export const AdminUploadModal: React.FC<AdminUploadModalProps> = ({
  isOpen,
  onClose,
  documents,
  onAddDocument,
  onDeleteDocument,
  onResetDocuments,
  isAdminLoggedIn,
  onAdminLogin,
  onAdminLogout,
}) => {
  // Login Form States
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Admin Panel States
  const [activeTab, setActiveTab] = useState<'upload' | 'manage'>('upload');
  const [title, setTitle] = useState('');
  const [docNumber, setDocNumber] = useState('');
  const [category, setCategory] = useState<CampusDocument['category']>('peraturan');
  const [effectiveDate, setEffectiveDate] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // PDF Extraction States
  const [isExtractingPdf, setIsExtractingPdf] = useState(false);
  const [extractedPdfInfo, setExtractedPdfInfo] = useState<{
    fileName: string;
    numPages: number;
    charCount: number;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setLoginError('');
      setStatusMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle Login Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password: password.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onAdminLogin(data.token, data.user?.username || username);
        setUsername('');
        setPassword('');
      } else {
        setLoginError(data.error || 'Username atau password admin salah.');
      }
    } catch {
      // Fallback local check jika server offline
      if (
        (username.trim().toLowerCase() === 'admin' || username.trim().toLowerCase() === 'admin_polsri') &&
        password.trim() === 'adminpolsri2026'
      ) {
        onAdminLogin('polsri-admin-authorized-session-2026', 'admin');
        setUsername('');
        setPassword('');
      } else {
        setLoginError('Username atau kata sandi admin salah. Periksa kembali.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Quick fill default credentials for demo convenience
  const handleFillDemoCredentials = () => {
    setUsername('admin');
    setPassword('adminpolsri2026');
    setLoginError('');
  };

  // Auto-detect metadata from PDF text
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
    const skMatch =
      fullText.match(/(?:Nomor|No\.?)\s*:\s*([0-9A-Za-z\/\.\-\_]+(?:\s+[0-9A-Za-z\/\.\-\_]+)?)/i) ||
      fullText.match(/SK\s+Direktur\s+(?:Nomor|No\.?)\s*([0-9A-Za-z\/\.\-\_]+)/i);
    if (skMatch && skMatch[1]) {
      const cleanedSk = skMatch[1].replace(/[\n\r]/g, ' ').trim().slice(0, 50);
      if (cleanedSk.length > 3) {
        setDocNumber(`No. ${cleanedSk}`);
      }
    }

    // 3. Detect Academic Year / Semester
    const yearMatch = fullText.match(
      /(?:Tahun\s+Akademik|Tahun\s+Ajaran|Semester)\s+([0-9A-Za-z\/\s\-]+(?:202\d\/202\d|202\d))/i
    );
    if (yearMatch && yearMatch[1]) {
      setEffectiveDate(yearMatch[0].trim().slice(0, 40));
    }
  };

  // Process file upload (PDF or Text)
  const processUploadedFile = async (file: File) => {
    setStatusMessage(null);

    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      try {
        setIsExtractingPdf(true);
        const result = await extractTextFromPdf(file);

        if (!result.text || result.text.trim().length === 0) {
          throw new Error('Teks dokumen PDF kosong atau berupa hasil scan gambar tanpa teks digital (OCR).');
        }

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
          text: `File "${file.name}" (${result.numPages} halaman) berhasil dibaca secara digital! Tinjau data lalu klik "Tanamkan ke Memori AI".`,
        });
      } catch (err: any) {
        console.error('Error extracting PDF:', err);
        setStatusMessage({
          type: 'error',
          text: `Gagal membaca file PDF: ${err?.message || 'Pastikan file PDF dapat dibuka.'}`,
        });
      } finally {
        setIsExtractingPdf(false);
      }
      return;
    }

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
            text: `File "${file.name}" berhasil dimuat.`,
          });
        }
      };
      reader.readAsText(file);
      return;
    }

    setStatusMessage({
      type: 'error',
      text: 'Format file tidak didukung. Mohon gunakan file .pdf, .txt, atau .md.',
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
      processUploadedFile(file);
    }
  };

  const handleDocumentSubmit = async (e: React.FormEvent) => {
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
      summary: summary.trim() || content.substring(0, 150) + '...',
      content: content.trim(),
      sourceUrl: 'https://polsri.ac.id/',
    });

    setSubmitting(false);

    if (success) {
      setStatusMessage({
        type: 'success',
        text: `Dokumen "${title}" berhasil disimpan! AI Bantuku sekarang siap mengutip dokumen ini.`,
      });
      setTitle('');
      setDocNumber('');
      setSummary('');
      setContent('');
      setExtractedPdfInfo(null);
      setTimeout(() => {
        setActiveTab('manage');
        setStatusMessage(null);
      }, 1500);
    } else {
      setStatusMessage({
        type: 'error',
        text: 'Gagal menyimpan dokumen ke server. Coba beberapa saat lagi.',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-geminiFadeIn">
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col rounded-2xl bg-white dark:bg-[#1E1F20] text-slate-900 dark:text-slate-100 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        
        {/* Header Modal */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-[#18191A]/80">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              isAdminLoggedIn
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
            }`}>
              {isAdminLoggedIn ? <ShieldCheck className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                  {isAdminLoggedIn ? 'Panel Admin Dokumen Kampus' : 'Akses Terbatas: Login Administrator'}
                </h3>
                {isAdminLoggedIn && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                    Admin Aktif
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isAdminLoggedIn
                  ? 'Kelola dan unggah file PDF dokumen resmi BAAK & Akademik Polsri'
                  : 'Hanya staf / admin berwenang yang dapat mengunggah file PDF dan aturan baru'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdminLoggedIn && (
              <button
                onClick={onAdminLogout}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Keluar dari mode admin"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {!isAdminLoggedIn ? (
            /* ================= LOGIN FORM (JIKA BELUM LOGIN) ================= */
            <div className="max-w-md mx-auto py-4 space-y-6">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-inner">
                  <Shield className="w-7 h-7" />
                </div>
                <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Verifikasi Staf / Admin Polsri
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Fitur upload PDF dokumen resmi dan pengelolaan basis pengetahuan kampus dilindungi untuk menjaga keaslian data akademik.
                </p>
              </div>

              {loginError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Username Admin
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Masukkan username admin..."
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131314] text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Password Admin
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Masukkan kata sandi admin..."
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 pr-10 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131314] text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-blue-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
                >
                  {isLoggingIn ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Memverifikasi...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Masuk sebagai Admin</span>
                    </>
                  )}
                </button>
              </form>

              {/* Informative credentials box */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Kredensial Default Admin:
                  </span>
                  <button
                    type="button"
                    onClick={handleFillDemoCredentials}
                    className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    Isi Otomatis
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded-lg bg-white dark:bg-[#1E1F20] border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400 block text-[10px]">Username:</span>
                    <code className="font-mono font-bold text-blue-600 dark:text-blue-400">admin</code>
                  </div>
                  <div className="p-2 rounded-lg bg-white dark:bg-[#1E1F20] border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400 block text-[10px]">Password:</span>
                    <code className="font-mono font-bold text-blue-600 dark:text-blue-400">adminpolsri2026</code>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ================= ADMIN DASHBOARD (JIKA SUDAH LOGIN) ================= */
            <div className="space-y-5">
              {/* Tab Navigation */}
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('upload')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer ${
                      activeTab === 'upload'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload & Ekstrak PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('manage')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer ${
                      activeTab === 'manage'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Kelola Dokumen ({documents.length})</span>
                  </button>
                </div>

                <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>Sesi Admin Terverifikasi</span>
                </div>
              </div>

              {statusMessage && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                    statusMessage.type === 'success'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                      : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                  }`}
                >
                  {statusMessage.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                  )}
                  <span>{statusMessage.text}</span>
                </div>
              )}

              {activeTab === 'upload' ? (
                /* TAB 1: UPLOAD & EKSTRAK PDF */
                <form onSubmit={handleDocumentSubmit} className="space-y-4">
                  {/* Dropzone PDF */}
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
                      isDragging
                        ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/40 ring-4 ring-blue-500/20'
                        : 'border-blue-200 dark:border-blue-900/60 bg-gradient-to-b from-blue-50/40 to-white dark:from-blue-950/20 dark:to-[#1E1F20] hover:border-blue-400'
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
                            Membaca halaman, pasal, dan nomor SK secara digital...
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
                                PDF Berhasil Dibaca
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              {extractedPdfInfo.numPages} Halaman • {extractedPdfInfo.charCount.toLocaleString()} Karakter siap ditanamkan
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
                          Ganti PDF
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
                          <span>Teks, nomor SK, dan ringkasan akan otomatis diekstrak</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Form Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Judul Dokumen / Nama Peraturan *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: SK Tarif UKT Mahasiswa 2026"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131314] text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Nomor SK / Surat Resmi
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: No. 12/PL6/AK/2026"
                        value={docNumber}
                        onChange={(e) => setDocNumber(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131314] text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Kategori Dokumen
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as CampusDocument['category'])}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131314] text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-blue-500"
                      >
                        <option value="peraturan">Peraturan Akademik & Tata Tertib</option>
                        <option value="ukt">SK Tarif UKT & Keringanan</option>
                        <option value="sop">SOP Layanan BAAK</option>
                        <option value="kalender">Kalender & Jadwal Akademik</option>
                        <option value="beasiswa">Pedoman Beasiswa / KIP-K</option>
                        <option value="surat_edaran">Surat Edaran Direktur / UPA</option>
                        <option value="lainnya">Lainnya</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Masa Berlaku / Tahun Akademik
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Tahun Akademik 2025/2026"
                        value={effectiveDate}
                        onChange={(e) => setEffectiveDate(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131314] text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Ringkasan Singkat (Untuk Penjelasan Cepat AI)
                    </label>
                    <input
                      type="text"
                      placeholder="Ringkasan poin penting dari isi dokumen..."
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131314] text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Isi Teks Lengkap Dokumen (Otomatis dari PDF) *
                      </label>
                      <span className="text-[10.5px] text-slate-400">
                        {content.length > 0 ? `${content.length.toLocaleString()} karakter diekstrak` : 'Kosong'}
                      </span>
                    </div>
                    <textarea
                      required
                      rows={6}
                      placeholder="Teks dokumen PDF akan otomatis terisi di sini saat Anda mengunggah file PDF. Anda juga bisa mengedit atau menambahkan catatan..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131314] text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-blue-500 leading-relaxed"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={submitting || isExtractingPdf}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50 shadow-xs"
                    >
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>{submitting ? 'Menyimpan ke AI...' : 'Tanamkan ke Memori AI'}</span>
                    </button>
                  </div>
                </form>
              ) : (
                /* TAB 2: KELOLA DOKUMEN (LIST DOKUMEN + SEARCH + DELETE + RESET) */
                <div className="space-y-3.5">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                    {/* Search Input */}
                    <div className="relative flex-1 max-w-sm">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Cari dokumen, SK, atau aturan..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131314] text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-blue-500"
                      />
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 text-xs">
                      <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                        {documents.length} Dokumen Aktif
                      </span>
                      <button
                        type="button"
                        onClick={async () => {
                          if (window.confirm('Reset semua dokumen kembali ke 5 Dokumen Resmi Standar Polsri?')) {
                            const ok = await onResetDocuments();
                            if (ok) {
                              setStatusMessage({ type: 'success', text: 'Dokumen berhasil direset ke standar kampus.' });
                            }
                          }
                        }}
                        className="text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-1.5 transition-colors cursor-pointer text-[11px]"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reset Default</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
                    {documents
                      .filter((doc) => {
                        if (!searchQuery.trim()) return true;
                        const q = searchQuery.toLowerCase();
                        return (
                          doc.title.toLowerCase().includes(q) ||
                          doc.docNumber.toLowerCase().includes(q) ||
                          doc.summary.toLowerCase().includes(q) ||
                          doc.content.toLowerCase().includes(q)
                        );
                      })
                      .map((doc) => {
                      const isExpanded = expandedDocId === doc.id;
                      return (
                        <div
                          key={doc.id}
                          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#18191A] p-3.5 transition-all"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                                  {doc.title}
                                </span>
                                {doc.isBuiltIn && (
                                  <span className="px-2 py-0.2 rounded-full text-[9.5px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                                    Dokumen Inti
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                {doc.docNumber} • Berlaku: {doc.effectiveDate}
                              </p>
                              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">
                                {doc.summary}
                              </p>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setExpandedDocId(isExpanded ? null : doc.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                title="Lihat detail teks"
                              >
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  if (window.confirm(`Hapus dokumen "${doc.title}" dari memori AI?`)) {
                                    const ok = await onDeleteDocument(doc.id);
                                    if (ok) {
                                      setStatusMessage({ type: 'success', text: `Dokumen "${doc.title}" berhasil dihapus.` });
                                    }
                                  }
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
                                title="Hapus dokumen"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] font-mono text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-black/20 p-2.5 rounded-lg max-h-48 overflow-y-auto whitespace-pre-wrap">
                              {doc.content}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#18191A]/50 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Sistem Helpdesk & Basis Pengetahuan Politeknik Negeri Sriwijaya</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
