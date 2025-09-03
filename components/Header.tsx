
import React from 'react';
import { Icons } from './Icons';

interface HeaderProps {
  onReset: () => void;
  showReset: boolean;
}

const Header: React.FC<HeaderProps> = ({ onReset, showReset }) => {
  return (
    <header className="w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 p-4 shadow-sm sticky top-0 z-10">
      <div className="max-w-5xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-sky-500 rounded-full flex items-center justify-center text-white font-bold text-lg font-serif">
            A
          </div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
            AI French Tutor
          </h1>
        </div>
        {showReset && (
          <button
            onClick={onReset}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 rounded-md hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
            title="Start New Topic"
          >
            <Icons.reset className="w-4 h-4" />
            <span>New Topic</span>
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
