import React from 'react';
import { SparklesIcon } from './icons';

interface HeaderProps {
  onGenerate: () => void;
  isGenerating: boolean;
}

const Header: React.FC<HeaderProps> = ({ onGenerate, isGenerating }) => {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              AI Class Scheduler
            </h1>
          </div>
          <div className="flex items-center">
            <button
              onClick={onGenerate}
              disabled={isGenerating}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors"
            >
              <SparklesIcon className="h-5 w-5 mr-2" />
              {isGenerating ? 'Generating...' : 'AI Generate Schedule'}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
