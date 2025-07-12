import React from 'react';
import { SparklesIcon } from './icons';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex flex-col items-center justify-center z-50">
      <div className="relative">
        <div className="w-24 h-24 border-4 border-t-4 border-gray-200 border-t-indigo-500 rounded-full animate-spin"></div>
        <SparklesIcon className="h-12 w-12 text-indigo-400 absolute top-1/2 left-1/2 -mt-6 -ml-6" />
      </div>
      <p className="mt-4 text-white text-lg font-semibold">AI is crafting the schedule...</p>
    </div>
  );
};

export default LoadingSpinner;
