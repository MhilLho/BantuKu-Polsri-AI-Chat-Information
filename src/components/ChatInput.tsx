import React, { useRef, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  onSend: () => void;
  isLoading: boolean;
  onOpenInfo: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  input,
  setInput,
  onSend,
  isLoading,
  onOpenInfo,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea smoothly without showing any scrollbars
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollH = textareaRef.current.scrollHeight;
      // Normal single line is ~24px, grows up to ~110px
      textareaRef.current.style.height = `${Math.min(Math.max(scrollH, 24), 110)}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && input.trim()) {
        onSend();
      }
    }
  };

  const canSend = !isLoading && input.trim().length > 0;

  return (
    <div className="w-full max-w-2xl mx-auto px-4 pb-[max(0.85rem,env(safe-area-inset-bottom))] pt-1 select-none">
      {/* Modern, Clean & Sleek Floating Pill */}
      <div className="relative flex items-center gap-2 bg-[#F3F4F6] dark:bg-[#1E1F20] rounded-full border border-[#D1D5DB] dark:border-[#333538] hover:border-[#9CA3AF] dark:hover:border-[#4B4E54] focus-within:!border-[#0095F6] focus-within:ring-3 focus-within:ring-[#0095F6]/15 transition-all duration-200 shadow-xs pl-5 pr-2 py-1.5">
        {/* Text Area (Scrollbar completely hidden, perfect vertical center) */}
        <textarea
          ref={textareaRef}
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Tanya Bantuku..."
          disabled={isLoading}
          className="flex-1 bg-transparent resize-none border-none outline-hidden text-[14.5px] text-[#1F1F1F] dark:text-[#F3F4F6] placeholder-[#6B7280] dark:placeholder-[#9CA3AF] py-1 leading-[22px] max-h-[110px] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        />

        {/* Circular Send Button (Aligned side-by-side) */}
        <button
          type="button"
          onClick={onSend}
          disabled={!canSend}
          className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center transition-all duration-150 cursor-pointer ${
            canSend
              ? 'bg-[#0095F6] text-white hover:bg-[#0081D6] active:scale-95 shadow-sm'
              : 'bg-black/8 dark:bg-white/8 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-60'
          }`}
          title="Kirim (Enter)"
          aria-label="Kirim"
        >
          <ArrowUp className="w-4 h-4 stroke-[2.4]" />
        </button>
      </div>

      {/* Subtle Disclaimer Text */}
      <div className="text-center mt-2 px-2">
        <p className="text-[11.5px] text-slate-500 dark:text-slate-400 leading-tight">
          Jawaban bersifat informatif. Untuk kepastian berkas resmi, hubungi{' '}
          <button
            onClick={onOpenInfo}
            className="text-[#0095F6] hover:underline font-medium inline cursor-pointer"
          >
            Subbagian Akademik & Kemahasiswaan Polsri
          </button>
          .
        </p>
      </div>
    </div>
  );
};


