import React from 'react';
import { 
  ArrowLeft,
  Globe
} from 'lucide-react';

interface HeaderProps {
  onBack?: () => void;
  coinsBalance?: number;
  activeTab?: string;
}

export default function DashboardHeader({ onBack, activeTab }: HeaderProps) {
  return (
    <div className="w-full h-16 bg-[#0c0c0e] border-b border-[#1a1a1c] px-4 sm:px-6 flex items-center justify-between select-none shrink-0 text-white relative z-20">
      {/* Left items */}
      <div className="flex items-center gap-3">
        {onBack && (
          <button 
            onClick={onBack}
            className="w-8 h-8 rounded-full border border-zinc-800 flex items-center justify-center hover:bg-zinc-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-zinc-400" />
          </button>
        )}
        <span className="text-xs sm:text-sm font-medium text-zinc-400 font-sans tracking-wide">
          Studio Portal &gt; <span className="text-white capitalize">{activeTab?.replace('-', ' ')}</span>
        </span>
      </div>

      {/* Right items */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        <a 
          href="https://personalizedgiftshop.in" 
          className="flex items-center gap-2 border border-zinc-800 bg-zinc-950 px-3 py-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors text-xs font-semibold cursor-pointer"
        >
          <Globe className="w-4 h-4 text-amber-500" />
          <span>Back to Main Website</span>
        </a>
      </div>
    </div>
  );
}

