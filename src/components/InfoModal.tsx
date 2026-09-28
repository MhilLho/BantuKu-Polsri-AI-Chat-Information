import React from 'react';
import {
  X,
  Building2,
  Clock,
  Mail,
  Phone,
  ExternalLink,
  MapPin,
  GraduationCap,
} from 'lucide-react';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-geminiFadeIn select-none">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#1E1F20] rounded-[24px] border border-[#E3E3E3] dark:border-[#2D2E30] shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E3E3E3] dark:border-[#2D2E30]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#E8F0FE] dark:bg-[#1E293B] text-[#0095F6] flex items-center justify-center font-bold">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1F1F1F] dark:text-[#E3E3E3]">
                Layanan Administrasi Polsri
              </h3>
              <p className="text-xs text-[#5E5E5E] dark:text-[#8E8E8E]">
                Politeknik Negeri Sriwijaya
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

        {/* Modal Content */}
        <div className="p-6 space-y-4 text-sm text-[#1F1F1F] dark:text-[#E3E3E3] max-h-[75vh] overflow-y-auto">
          {/* Subbagian Akademik */}
          <div className="p-4 rounded-2xl bg-[#F0F4F9] dark:bg-[#282A2C] space-y-2.5 border border-[#E3E3E3] dark:border-[#333639]">
            <h4 className="font-bold flex items-center gap-2 text-[15px] text-[#1F1F1F] dark:text-[#E3E3E3]">
              <Building2 className="w-4 h-4 text-[#0095F6]" />
              Subbagian Akademik & Kemahasiswaan (BAAK)
            </h4>

            <div className="space-y-1.5 text-xs text-[#5E5E5E] dark:text-[#8E8E8E]">
              <div className="flex items-start gap-2 text-[#1F1F1F] dark:text-[#E3E3E3]">
                <MapPin className="w-3.5 h-3.5 text-[#0095F6] mt-0.5 flex-shrink-0" />
                <span>Gedung Kantor Pusat Lantai 1, Kampus Bukit Besar, Palembang</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Senin - Jumat, 08.00 - 16.00 WIB (Istirahat 12.00 - 13.00)</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                <a href="mailto:akademik@polsri.ac.id" className="text-[#0095F6] hover:underline">
                  akademik@polsri.ac.id
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                <span>(0711) 353414 (Hunting)</span>
              </div>
            </div>
          </div>

          {/* Quick links */}
          <div className="text-xs">
            <a
              href="https://polsri.ac.id/"
              target="_blank"
              rel="noreferrer"
              className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center justify-between font-semibold text-blue-600 dark:text-blue-400 transition-colors"
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold">Website Resmi Kampus Polsri</span>
                <span className="text-[11px] text-slate-500 font-normal">https://polsri.ac.id (Akses Publik Tanpa Login)</span>
              </div>
              <ExternalLink className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            </a>
          </div>

          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            💡 <strong>Panduan Loket:</strong> Untuk pengurusan surat aktif bertanda tangan basah atau legalisir, seluruh formulir dan pedoman resmi dapat diunduh langsung melalui website resmi kampus di <a href="https://polsri.ac.id/" target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 underline font-medium">polsri.ac.id</a> tanpa perlu login.
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#E3E3E3] dark:border-[#2D2E30] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full text-xs font-semibold bg-[#0095F6] text-white hover:bg-[#1A73E8] transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
