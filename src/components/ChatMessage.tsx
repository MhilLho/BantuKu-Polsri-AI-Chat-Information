import React from 'react';
import {
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  RotateCw,
  FileText,
  AlertCircle,
  Building2,
  ExternalLink,
} from 'lucide-react';
import { ChatMessageItem } from '../types';
import { renderMarkdown } from '../utils/markdown';

interface ChatMessageProps {
  message: ChatMessageItem;
  onFeedback: (messageId: string, feedback: 'like' | 'dislike') => void;
  onRetry?: (messageId: string) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  onFeedback,
  onRetry,
}) => {
  const isBot = message.role === 'assistant' || message.role === 'model';
  const isError = message.isError;

  const formattedTime = new Date(message.timestamp).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleLinkClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const anchor = (e.target as HTMLElement).closest('a');
    if (anchor && anchor.href) {
      e.preventDefault();
      window.open(anchor.href, '_blank', 'noopener,noreferrer');
    }
  };

  // User Message: Right-aligned crisp blue bubble with rounded shape
  if (!isBot) {
    return (
      <div className="flex justify-end mb-5 w-full animate-geminiFadeIn select-text">
        <div className="flex flex-col items-end max-w-[85%] sm:max-w-[75%]">
          <div className="px-4.5 py-2.5 rounded-2xl rounded-tr-xs bg-blue-600 dark:bg-blue-600 text-white text-[15px] sm:text-base leading-relaxed break-words shadow-sm shadow-blue-600/25 font-normal tracking-wide">
            {message.content}
          </div>
          <span className="text-[11px] text-gray-400 dark:text-gray-500 mt-1 mr-1 select-none font-medium">
            {formattedTime}
          </span>
        </div>
      </div>
    );
  }

  // Bot Message: Modern shaped card with clear steps, compact scannable layout (No copy button)
  return (
    <div className="flex items-start gap-2.5 sm:gap-3 mb-6 w-full animate-geminiFadeIn select-text">
      {/* Bot Avatar Icon */}
      <div className="w-8 h-8 rounded-xl bg-slate-800 dark:bg-slate-700 flex items-center justify-center text-white shrink-0 mt-0.5 select-none">
        <Sparkles className="w-4 h-4 fill-white" />
      </div>

      {/* Main Bot Content Container with distinct shape and subtle border */}
      <div className="flex-1 min-w-0 bg-[#F8FAFC] dark:bg-[#1A1D23] border border-[#E2E8F0] dark:border-[#2A2F3A] rounded-2xl rounded-tl-xs p-3.5 sm:p-4.5 shadow-xs transition-colors">
        {/* Compact Card Header */}
        <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-200/80 dark:border-slate-800/80 select-none">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-200">
              Bantuku Polsri
            </span>
            <span className="text-[10px] tracking-wide font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              Helpdesk
            </span>
          </div>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">{formattedTime}</span>
        </div>

        {isError ? (
          <div className="p-3.5 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 text-sm space-y-2">
            <div className="flex items-center gap-2 font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Gagal memproses pesan</span>
            </div>
            <p className="text-xs">{message.content}</p>
            {onRetry && (
              <button
                onClick={() => onRetry(message.id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-red-900/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 hover:bg-red-100 transition-colors cursor-pointer"
              >
                <RotateCw className="w-3 h-3" />
                Coba lagi
              </button>
            )}
          </div>
        ) : (
          <div
            className="gemini-prose"
            onClick={handleLinkClick}
            dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
          />
        )}

        {/* Source chips below answer */}
        {!isError && message.sources && message.sources.length > 0 && (
          <div className="mt-3.5 pt-2.5 border-t border-slate-200/70 dark:border-slate-800/70 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <FileText className="w-3 h-3 text-slate-400" />
              Rujukan:
            </span>
            {message.sources.map((src, index) => {
              const urlMatch = src.match(/(https?:\/\/[^\s)]+)/);
              const url = urlMatch ? urlMatch[1] : (src.toLowerCase().includes('polsri.ac.id') ? 'https://polsri.ac.id/' : null);

              if (url) {
                return (
                  <a
                    key={index}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      e.preventDefault();
                      window.open(url, '_blank', 'noopener,noreferrer');
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-100/70 hover:bg-slate-200/80 dark:bg-slate-800/50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                    title="Buka situs resmi di tab baru"
                  >
                    <span>{src}</span>
                    <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                  </a>
                );
              }

              return (
                <span
                  key={index}
                  className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300"
                >
                  {src}
                </span>
              );
            })}
          </div>
        )}

        {/* Action Toolbar: Feedback buttons (Like / Dislike) */}
        {!isError && (
          <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-slate-200/50 dark:border-slate-800/50 select-none text-slate-400 dark:text-slate-500">
            <div className="flex items-center gap-1">
              <button
                onClick={() => onFeedback(message.id, 'like')}
                className={`p-1 rounded-md hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer ${
                  message.feedback === 'like'
                    ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60'
                    : 'hover:text-slate-700 dark:hover:text-slate-200'
                }`}
                title="Membantu"
                aria-label="Jawaban membantu"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => onFeedback(message.id, 'dislike')}
                className={`p-1 rounded-md hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer ${
                  message.feedback === 'dislike'
                    ? 'text-red-500 bg-red-50 dark:bg-red-950/60'
                    : 'hover:text-slate-700 dark:hover:text-slate-200'
                }`}
                title="Kurang membantu"
                aria-label="Jawaban kurang membantu"
              >
                <ThumbsDown className="w-3.5 h-3.5" />
              </button>

              {message.feedbackSubmitted && (
                <span className="text-[11px] text-slate-600 dark:text-slate-400 ml-1.5 font-medium">
                  Terima kasih!
                </span>
              )}
            </div>

            <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
              <Building2 className="w-3 h-3 text-slate-400" />
              Polsri Official
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
