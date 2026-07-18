import React from 'react';
import { 
  PlayCircle, 
  Gift, 
  Bell, 
  Sun, 
  Moon, 
  Globe, 
  Coins, 
  ArrowLeft,
  ChevronDown
} from 'lucide-react';
import { toast } from 'sonner';

interface HeaderProps {
  onBack?: () => void;
  coinsBalance?: number;
  activeTab?: string;
}

export default function DashboardHeader({ onBack, coinsBalance = 38, activeTab }: HeaderProps) {
  const triggerTutorial = () => {
    toast.info('Opening video tutorial inside tutorial modal...', { duration: 4000 });
  };

  const triggerReferral = () => {
    toast.success('🎁 Referral link copied to clipboard! Share with other photographers to earn premium credits!', { duration: 5000 });
    navigator.clipboard?.writeText?.('https://personalizedgiftshop.in/referral?code=RAJESH779');
  };

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
        {/* Video Tutorial */}
        <button
          onClick={triggerTutorial}
          className="hidden md:flex items-center gap-2 border border-amber-500/30 bg-amber-500/5 px-3 py-1.5 rounded-lg text-amber-500 hover:bg-amber-500/10 transition-colors text-xs font-semibold"
        >
          <PlayCircle className="w-4 h-4" />
          <span>Video Tutorial</span>
        </button>

        {/* Refer & Earn */}
        <button
          onClick={triggerReferral}
          className="hidden sm:flex items-center gap-2 border border-zinc-800 bg-zinc-950 px-3 py-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors text-xs font-medium"
        >
          <Gift className="w-4 h-4 text-amber-500" />
          <span>Refer &amp; Earn</span>
        </button>

        {/* Notifications Icon with Badge */}
        <div className="relative cursor-pointer hover:bg-zinc-900/50 p-2 rounded-lg transition-colors">
          <Bell className="w-4.5 h-4.5 text-zinc-400 hover:text-white transition-colors" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full ring-2 ring-[#0c0c0e]" />
        </div>

        {/* Theme toggle (styled for preview simplicity) */}
        <button 
          onClick={() => toast('✨ Experience premium default dark mode')}
          className="p-2 hover:bg-zinc-900/50 rounded-lg transition-colors text-zinc-400 hover:text-white"
        >
          <Sun className="w-4.5 h-4.5" />
        </button>

        {/* Language dropdown */}
        <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-800/80 px-2.5 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-zinc-900 transition-colors text-zinc-300">
          <Globe className="w-3.5 h-3.5 text-zinc-400" />
          <span className="font-semibold uppercase font-sans">EN</span>
          <ChevronDown className="w-3 h-3 text-zinc-500" />
        </div>
      </div>
    </div>
  );
}
