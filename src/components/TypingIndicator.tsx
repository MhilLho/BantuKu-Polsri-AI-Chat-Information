import React from 'react';
import { Sparkles } from 'lucide-react';

export const TypingIndicator: React.FC = () => {
  return (
    <div className="flex items-start gap-3 sm:gap-4 mb-8 w-full animate-geminiFadeIn select-none">
      {/* Bot Sparkles Avatar */}
      <div className="w-8 h-8 rounded-full bg-[#0095F6] flex items-center justify-center text-white flex-shrink-0 mt-0.5 shadow-2xs">
        <Sparkles className="w-4 h-4 fill-white animate-spin [animation-duration:3s]" />
      </div>

      {/* Typing/Loading Content (Subtle pulsing dots & shimmer line) */}
      <div className="flex-1 space-y-2.5 pt-1.5">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#0095F6] gemini-dot-1" />
          <span className="w-2 h-2 rounded-full bg-[#0095F6] gemini-dot-2" />
          <span className="w-2 h-2 rounded-full bg-[#0095F6] gemini-dot-3" />
          <span className="text-xs text-[#5E5E5E] dark:text-[#8E8E8E] ml-2 font-medium">
            Bantuku sedang merumuskan jawaban...
          </span>
        </div>

        {/* Shimmer skeleton lines */}
        <div className="w-full max-w-md h-3 rounded-full gemini-shimmer-line opacity-70" />
        <div className="w-3/4 max-w-sm h-3 rounded-full gemini-shimmer-line opacity-50" />
      </div>
    </div>
  );
};
