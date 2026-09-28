import React from 'react';
import {
  Plus,
  MessageSquare,
  Trash2,
  X,
  ExternalLink,
  Globe,
  Sparkles,
  Info,
  ChevronLeft,
  Sun,
  Moon,
  BookOpen,
  Shield,
  ShieldCheck,
} from 'lucide-react';
import { ChatSession } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
  onDeleteSession: (sessionId: string, e: React.MouseEvent) => void;
  onOpenInfo: () => void;
  onOpenDocuments: () => void;
  onOpenAdmin: () => void;
  isAdminLoggedIn: boolean;
  documentsCount?: number;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onToggle,
  sessions,
  currentSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onOpenInfo,
  onOpenDocuments,
  onOpenAdmin,
  isAdminLoggedIn,
  documentsCount = 5,
  theme,
  onToggleTheme,
}) => {
  return (
    <>
      {/* Mobile/Tablet Backdrop Overlay (< 1024px) */}
      <div
        onClick={onToggle}
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-xs transition-opacity duration-300 lg:hidden ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden="true"
      />

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-[280px] bg-[#F0F4F9] dark:bg-[#1E1F20] border-r border-[#E3E3E3] dark:border-[#2D2E30] flex flex-col transition-all duration-300 ease-in-out select-none
          lg:static lg:z-auto
          ${
            isOpen
              ? 'translate-x-0 lg:w-[280px] lg:opacity-100'
              : '-translate-x-full lg:-ml-[280px] lg:w-[280px] lg:opacity-0'
          }
        `}
      >
        {/* Top Header: Logo + Collapse Button */}
        <div className="flex items-center justify-between p-4 pb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#0095F6] flex items-center justify-center text-white font-bold text-sm shadow-xs flex-shrink-0">
              <Sparkles className="w-4 h-4 fill-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-[15px] text-[#1F1F1F] dark:text-[#E3E3E3] tracking-tight">
                Bantuku
              </span>
              <span className="text-[11px] text-[#5E5E5E] dark:text-[#8E8E8E] leading-none">
                Polsri Helpdesk
              </span>
            </div>
          </div>

          {/* Close button on mobile, Collapse on desktop */}
          <button
            onClick={onToggle}
            className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-[#5E5E5E] dark:text-[#8E8E8E] hover:text-[#1F1F1F] dark:hover:text-[#E3E3E3] transition-colors cursor-pointer"
            title="Tutup Menu"
            aria-label="Tutup Menu"
          >
            <span className="hidden lg:inline">
              <ChevronLeft className="w-5 h-5" />
            </span>
            <span className="lg:hidden">
              <X className="w-5 h-5" />
            </span>
          </button>
        </div>

        {/* New Chat Button (Pill style like Gemini) */}
        <div className="px-3 py-3">
          <button
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 1024) {
                onToggle();
              }
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-full bg-white dark:bg-[#131314] text-[#1F1F1F] dark:text-[#E3E3E3] hover:shadow-xs border border-[#E3E3E3] dark:border-[#2D2E30] hover:bg-[#F8FAFC] dark:hover:bg-[#282A2C] transition-all text-sm font-medium cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#0095F6]" />
            <span>Chat baru</span>
          </button>
        </div>

        {/* Recent Chats Section */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          <div className="px-3 py-1.5 text-[11px] font-semibold tracking-wider uppercase text-[#5E5E5E] dark:text-[#8E8E8E]">
            Terbaru
          </div>

          {sessions.length === 0 ? (
            <div className="px-3 py-4 text-xs text-[#5E5E5E] dark:text-[#8E8E8E] italic">
              Belum ada riwayat percakapan
            </div>
          ) : (
            sessions.map((session) => {
              const isActive = session.id === currentSessionId;
              return (
                <div
                  key={session.id}
                  onClick={() => {
                    onSelectSession(session.id);
                    if (window.innerWidth < 1024) {
                      onToggle();
                    }
                  }}
                  className={`group relative flex items-center justify-between px-3 py-2.5 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-[#E3E8EC] dark:bg-[#282A2C] text-[#1F1F1F] dark:text-[#E3E3E3] font-semibold'
                      : 'text-[#5E5E5E] dark:text-[#8E8E8E] hover:bg-black/5 dark:hover:bg-white/5 hover:text-[#1F1F1F] dark:hover:text-[#E3E3E3]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-6">
                    <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 opacity-70" />
                    <span className="truncate" title={session.title}>
                      {session.title || 'Percakapan Tanpa Judul'}
                    </span>
                  </div>

                  <button
                    onClick={(e) => onDeleteSession(session.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-[#5E5E5E] dark:text-[#8E8E8E] hover:text-red-500 transition-opacity"
                    title="Hapus chat"
                    aria-label="Hapus chat"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Section: Info Kampus, Tema & Bantuan */}
        <div className="p-3 border-t border-[#E3E3E3] dark:border-[#2D2E30] space-y-1">
          {/* Theme switcher button */}
          <button
            onClick={onToggleTheme}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-full text-xs font-medium text-[#5E5E5E] dark:text-[#8E8E8E] hover:bg-black/5 dark:hover:bg-white/5 hover:text-[#1F1F1F] dark:hover:text-[#E3E3E3] transition-colors cursor-pointer text-left"
          >
            <div className="flex items-center gap-3">
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-[#0095F6]" />
              )}
              <span>Tema: {theme === 'dark' ? 'Gelap' : 'Terang'}</span>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-[#5E5E5E] dark:text-[#8E8E8E]">
              {theme === 'dark' ? 'Gelap' : 'Terang'}
            </span>
          </button>

          <button
            onClick={() => {
              onOpenDocuments();
              if (window.innerWidth < 1024) {
                onToggle();
              }
            }}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-full text-xs font-medium text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer text-left"
          >
            <div className="flex items-center gap-3">
              <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Dokumen Resmi Kampus</span>
            </div>
            <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-[10px] font-bold">
              {documentsCount}
            </span>
          </button>

          <button
            onClick={() => {
              onOpenAdmin();
              if (window.innerWidth < 1024) {
                onToggle();
              }
            }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-full text-xs font-medium transition-colors cursor-pointer text-left ${
              isAdminLoggedIn
                ? 'text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/40'
                : 'text-[#5E5E5E] dark:text-[#8E8E8E] hover:bg-black/5 dark:hover:bg-white/5 hover:text-[#1F1F1F] dark:hover:text-[#E3E3E3]'
            }`}
          >
            <div className="flex items-center gap-3">
              {isAdminLoggedIn ? (
                <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              ) : (
                <Shield className="w-4 h-4 text-[#5E5E5E] dark:text-[#8E8E8E]" />
              )}
              <span>{isAdminLoggedIn ? 'Panel Admin (Aktif)' : 'Upload PDF (Khusus Admin)'}</span>
            </div>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
              isAdminLoggedIn
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}>
              {isAdminLoggedIn ? 'Admin' : 'Login'}
            </span>
          </button>

          <button
            onClick={() => {
              onOpenInfo();
              if (window.innerWidth < 1024) {
                onToggle();
              }
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-full text-xs font-medium text-[#5E5E5E] dark:text-[#8E8E8E] hover:bg-black/5 dark:hover:bg-white/5 hover:text-[#1F1F1F] dark:hover:text-[#E3E3E3] transition-colors cursor-pointer text-left"
          >
            <Info className="w-4 h-4 text-[#0095F6]" />
            <span>Info & Loket Polsri</span>
          </button>

          <a
            href="https://polsri.ac.id/"
            target="_blank"
            rel="noreferrer"
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-full text-xs font-medium text-[#5E5E5E] dark:text-[#8E8E8E] hover:bg-black/5 dark:hover:bg-white/5 hover:text-[#1F1F1F] dark:hover:text-[#E3E3E3] transition-colors"
          >
            <div className="flex items-center gap-3">
              <Globe className="w-4 h-4 text-[#5E5E5E] dark:text-[#8E8E8E]" />
              <span>Website Resmi Polsri</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 opacity-60" />
          </a>
        </div>
      </aside>
    </>
  );
};
