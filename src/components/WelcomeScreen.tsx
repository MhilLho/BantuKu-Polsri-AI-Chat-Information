import React from 'react';
import {
  FileText,
  Calendar,
  CreditCard,
  UserX,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import { QuickQuestion } from '../types';

interface WelcomeScreenProps {
  onSelectPrompt: (prompt: string) => void;
}

const PRIMARY_QUESTIONS: QuickQuestion[] = [
  {
    id: 'surat-aktif',
    title: 'Surat Keterangan Aktif Kuliah',
    description: 'Syarat dokumen, unduh panduan via website resmi polsri.ac.id',
    category: 'surat',
    prompt: 'Bagaimana cara mengajukan surat keterangan aktif kuliah di Polsri?',
  },
  {
    id: 'her-registrasi',
    title: 'Her-registrasi & KRS',
    description: 'Jadwal registrasi semester, konsultasi DPA, dan cetak KRS',
    category: 'registrasi',
    prompt: 'Kapan jadwal her-registrasi dan bagaimana alur pengisian KRS di Polsri?',
  },
  {
    id: 'pembayaran-ukt',
    title: 'Pembayaran & penyesuaian UKT',
    description: 'Metode bayar bank mitra, nomor VA, dan syarat keringanan',
    category: 'ukt',
    prompt: 'Bagaimana info pembayaran UKT Polsri, bank mitra resmi, dan prosedur permohonan keringanan?',
  },
  {
    id: 'cuti-akademik',
    title: 'Cuti Akademik',
    description: 'Batas maksimal semester, bebas pustaka/lab, dan persetujuan',
    category: 'cuti',
    prompt: 'Apa saja syarat dan prosedur mengajukan cuti akademik di Polsri?',
  },
];

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onSelectPrompt }) => {
  const getIcon = (category: QuickQuestion['category']) => {
    switch (category) {
      case 'surat':
        return <FileText className="w-5 h-5 text-[#0095F6]" />;
      case 'registrasi':
        return <Calendar className="w-5 h-5 text-amber-500" />;
      case 'ukt':
        return <CreditCard className="w-5 h-5 text-emerald-500" />;
      case 'cuti':
        return <UserX className="w-5 h-5 text-purple-500" />;
      default:
        return <Sparkles className="w-5 h-5 text-[#0095F6]" />;
    }
  };

  return (
    <div className="w-full flex flex-col justify-center py-6 sm:py-12 select-none">
      {/* Centered Greeting in Gemini Style */}
      <div className="mb-8 sm:mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8F0FE] dark:bg-[#1E293B] text-[#0095F6] text-xs font-semibold mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Helpdesk Administrasi Polsri</span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-2">
          <span className="bg-gradient-to-r from-[#0095F6] via-[#1A73E8] to-[#4285F4] bg-clip-text text-transparent">
            Halo, Rekan Mahasiswa Polsri
          </span>
        </h1>
        <p className="text-xl sm:text-2xl md:text-3xl font-medium text-[#5E5E5E] dark:text-[#8E8E8E] tracking-tight">
          Ada yang bisa Bantuku bantu hari ini?
        </p>
      </div>

      {/* Responsive 4 Suggestion Cards Grid (4 cols on desktop, 2 on tablet, 1-2 on phone) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
        {PRIMARY_QUESTIONS.map((q) => (
          <button
            key={q.id}
            onClick={() => onSelectPrompt(q.prompt)}
            className="group relative flex flex-col justify-between p-4 sm:p-5 rounded-2xl bg-[#F0F4F9] dark:bg-[#1E1F20] hover:bg-[#E3E8EC] dark:hover:bg-[#282A2C] border border-transparent hover:border-[#E3E3E3] dark:hover:border-[#2D2E30] transition-all duration-200 text-left cursor-pointer min-h-[140px] sm:min-h-[160px]"
          >
            <div>
              <div className="w-9 h-9 rounded-xl bg-white dark:bg-[#131314] flex items-center justify-center mb-3 shadow-2xs group-hover:scale-105 transition-transform">
                {getIcon(q.category)}
              </div>
              <h3 className="font-bold text-sm sm:text-[15px] text-[#1F1F1F] dark:text-[#E3E3E3] leading-snug group-hover:text-[#0095F6] transition-colors">
                {q.title}
              </h3>
              <p className="text-xs text-[#5E5E5E] dark:text-[#8E8E8E] mt-1 line-clamp-2 leading-relaxed">
                {q.description}
              </p>
            </div>

            <div className="self-end mt-2 p-1.5 rounded-full bg-white dark:bg-[#131314] text-[#5E5E5E] dark:text-[#8E8E8E] group-hover:text-[#0095F6] group-hover:bg-[#E8F0FE] dark:group-hover:bg-[#1E293B] transition-colors">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
