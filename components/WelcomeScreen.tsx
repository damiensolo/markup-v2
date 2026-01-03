
import React from 'react';
import { UploadIcon } from './Icons';

interface WelcomeScreenProps {
  onUploadClick: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onUploadClick }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full border-4 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center">
      <UploadIcon className="w-24 h-24 text-gray-400 dark:text-gray-500 mb-4" />
      <h2 className="text-2xl font-semibold mb-2">Upload Your Blueprint</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">Select an image or PDF file to start highlighting.</p>
      <button
        onClick={onUploadClick}
        className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 flex items-center gap-2"
      >
        <UploadIcon className="w-5 h-5" /> Choose File
      </button>
    </div>
  );
};

export default WelcomeScreen;
