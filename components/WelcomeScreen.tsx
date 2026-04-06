
import React from 'react';
import { UploadIcon } from './Icons';

interface WelcomeScreenProps {
  onUploadClick: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onUploadClick }) => {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-gray-50/80 p-8 text-center dark:bg-zinc-900/50">
      <UploadIcon className="w-24 h-24 text-blue-500 dark:text-blue-400/90 mb-4" />
      <h2 className="text-2xl font-bold text-gray-900 dark:text-zinc-100 mb-2 tracking-tight">Upload your blueprint</h2>
      <p className="text-gray-500 dark:text-zinc-400 mb-6 max-w-md text-sm leading-relaxed">
        Select an image or PDF to start marking up — same workspace as the rest of Linarc.
      </p>
      <button
        type="button"
        onClick={onUploadClick}
        className="linarc-btn-brand py-3 px-8 flex items-center gap-2 shadow-linarc-md"
      >
        <UploadIcon className="w-5 h-5" /> Choose file
      </button>
    </div>
  );
};

export default WelcomeScreen;
