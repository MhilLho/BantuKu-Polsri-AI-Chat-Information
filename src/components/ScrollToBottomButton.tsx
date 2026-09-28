import React from 'react';
import { ChevronDown } from 'lucide-react';

interface ScrollToBottomButtonProps {
  visible: boolean;
  onClick: () => void;
}

export const ScrollToBottomButton: React.FC<ScrollToBottomButtonProps> = ({
  visible,
  onClick,
}) => {
  if (!visible) return null;

  return (
    <button
      onClick={onClick}
      className="fixed bottom-28 right-6 z-20 p-2.5 rounded-full bg-white dark:bg-[#1E1F20] text-[#1F1F1F] dark:text-[#E3E3E3] border border-[#E3E3E3] dark:border-[#2D2E30] shadow-md hover:bg-[#F0F4F9] dark:hover:bg-[#282A2C] transition-all transform hover:scale-105 active:scale-95 animate-geminiFadeIn cursor-pointer"
      title="Gulir ke pesan terbaru"
      aria-label="Scroll to bottom"
    >
      <ChevronDown className="w-5 h-5" />
    </button>
  );
};
