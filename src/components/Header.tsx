import React from 'react';
import { Menu, Plus, RotateCcw, Info, Moon, Sun, BookOpen, Shield, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  onToggleSidebar: () => void;
  onNewChat: () => void;
  onOpenInfo: () => void;
  onOpenDocuments: () => void;
  onOpenAdmin: () => void;
  isAdminLoggedIn: boolean;
  documentsCount?: number;
  hasMessages: boolean;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  onNewChat,
  onOpenInfo,
  onOpenDocuments,
  onOpenAdmin,
  isAdminLoggedIn,
  documentsCount = 5,
  hasMessages,
  theme,
  onToggleTheme,
}) => {
  return (
    <header className="sticky top-0 z-30 w-full bg-white/95 dark:bg-[#131314]/95 backdrop-blur-md border-b border-[#E3E3E3] dark:border-[#2D2E30] select-none transition-colors">
      <div className="w-full px-3 sm:px-5 py-2.5 flex items-center justify-between gap-3">
        {/* Left: Hamburger Button + Title */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-full hover:bg-[#F0F4F9] dark:hover:bg-[#282A2C] text-[#1F1F1F] dark:text-[#E3E3E3] transition-colors focus:outline-none cursor-pointer"
            title="Buka / Tutup Menu"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5 stroke-[2]" />
          </button>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 cursor-pointer" onClick={onNewChat}>
              <span className="font-bold text-base sm:text-lg text-[#1F1F1F] dark:text-[#E3E3E3] tracking-tight">
                Bantuku
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#E8F0FE] text-[#0095F6] dark:bg-[#1E293B] dark:text-[#3897F0]">
                Polsri
              </span>
            </div>
          </div>
        </div>

        {/* Right: Theme Toggle, Documents Knowledge Base, Info & Reset / New Chat Action Buttons */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Documents Knowledge Base Button */}
          <button
            onClick={onOpenDocuments}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800 transition-colors cursor-pointer"
            title="Basis Pengetahuan Dokumen Resmi Kampus (SK & Peraturan)"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Dokumen Resmi</span>
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-200/80 dark:bg-emerald-800/80 text-[10px] font-bold">
              {documentsCount}
            </span>
          </button>

          {/* Admin / Upload PDF Button */}
          <button
            onClick={onOpenAdmin}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
              isAdminLoggedIn
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800 hover:bg-blue-100'
                : 'bg-slate-50 text-slate-700 dark:bg-slate-900/40 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100'
            }`}
            title={isAdminLoggedIn ? 'Panel Admin Polsri (Aktif)' : 'Upload PDF (Khusus Admin)'}
          >
            {isAdminLoggedIn ? (
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            ) : (
              <Shield className="w-3.5 h-3.5 text-slate-500" />
            )}
            <span className="hidden sm:inline">{isAdminLoggedIn ? 'Panel Admin' : 'Upload PDF'}</span>
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-full hover:bg-[#F0F4F9] dark:hover:bg-[#282A2C] text-[#5E5E5E] dark:text-[#8E8E8E] hover:text-[#1F1F1F] dark:hover:text-[#E3E3E3] transition-colors cursor-pointer"
            title={theme === 'dark' ? 'Ganti ke Tema Terang' : 'Ganti ke Tema Gelap'}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 stroke-[1.8] text-amber-400" />
            ) : (
              <Moon className="w-5 h-5 stroke-[1.8]" />
            )}
          </button>

          {/* Info Modal Button */}
          <button
            onClick={onOpenInfo}
            className="p-2 rounded-full hover:bg-[#F0F4F9] dark:hover:bg-[#282A2C] text-[#5E5E5E] dark:text-[#8E8E8E] hover:text-[#1F1F1F] dark:hover:text-[#E3E3E3] transition-colors cursor-pointer"
            title="Informasi Loket & Layanan Polsri"
            aria-label="Info Kampus"
          >
            <Info className="w-5 h-5 stroke-[1.8]" />
          </button>

          {/* New Chat Button */}
          <button
            onClick={onNewChat}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-[#0095F6] hover:bg-[#E8F0FE] dark:hover:bg-[#1E293B] border border-[#0095F6]/30 transition-colors cursor-pointer"
            title="Mulai Percakapan Baru"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Chat baru</span>
          </button>

          {/* Reset button if messages exist */}
          {hasMessages && (
            <button
              onClick={onNewChat}
              className="p-2 rounded-full hover:bg-[#F0F4F9] dark:hover:bg-[#282A2C] text-[#5E5E5E] dark:text-[#8E8E8E] hover:text-[#1F1F1F] dark:hover:text-[#E3E3E3] transition-colors cursor-pointer"
              title="Reset Chat"
              aria-label="Reset Chat"
            >
              <RotateCcw className="w-4 h-4 stroke-[1.8]" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
