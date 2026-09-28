import React from 'react';

interface FooterNoticeProps {
  onOpenInfo: () => void;
}

export const FooterNotice: React.FC<FooterNoticeProps> = ({ onOpenInfo }) => {
  return (
    <footer className="w-full max-w-[560px] mx-auto px-4 pt-1.5 pb-2 text-center select-none">
      <p className="text-[11px] text-[#8E8E8E] leading-normal">
        Jawaban bersifat informatif. Untuk kepastian, hubungi{' '}
        <button
          onClick={onOpenInfo}
          className="text-[#0095F6] hover:underline font-medium inline cursor-pointer"
        >
          Subbagian Akademik & Kemahasiswaan Polsri
        </button>
        .
      </p>
    </footer>
  );
};
