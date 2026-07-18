import React from 'react';
import { 
  LayoutGrid, 
  FolderOpen, 
  PlusSquare, 
  Zap, 
  Wallet, 
  Music, 
  Bell, 
  Settings, 
  User, 
  LogOut, 
  MessageSquare, 
  PhoneCall,
  Crown
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout?: () => void;
}

export default function DashboardSidebar({ activeTab, setActiveTab, onLogout }: SidebarProps) {
  const menuItems: { id: string; label: string; icon: any; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
    { id: 'my-albums', label: 'My Albums', icon: FolderOpen },
    { id: 'create-album', label: 'Create Album', icon: PlusSquare },
    { id: 'music', label: 'Music', icon: Music },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <div className="w-64 bg-[#09090b] text-white border-r border-[#1a1a1c] flex flex-col h-full select-none shrink-0">
      {/* Brand Logo */}
      <div className="p-6 border-b border-[#1a1a1c] flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Crown className="w-6 h-6 text-amber-500 fill-amber-500/20" />
          <span className="text-xl font-bold tracking-wider text-white">PGS Album</span>
          <span className="bg-amber-500/10 text-amber-500 text-[9px] px-1.5 py-0.5 rounded font-mono border border-amber-500/20">PRO</span>
        </div>
        <span className="text-[10px] text-amber-500/80 font-serif italic tracking-wider">Premium Live Slideshow</span>
      </div>

      {/* Navigation */}
      <nav className="flex-grow p-4 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all group ${
                isActive 
                  ? 'bg-amber-500/15 border-l-2 border-amber-500 text-amber-500 shadow-[inset_0_0_12px_rgba(245,158,11,0.05)]' 
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-amber-500' : 'text-zinc-400 group-hover:text-white'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isActive ? 'bg-amber-500 text-black' : 'bg-[#1e1e21] text-amber-500 border border-amber-500/20'}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Profile Footer */}
      <div className="p-4 border-t border-[#1a1a1c] space-y-4 bg-zinc-950/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 border border-amber-500 flex items-center justify-center text-black font-extrabold text-sm shadow-md shadow-amber-500/10">
            RK
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold text-white truncate">Rajesh Kumar</span>
            <span className="text-[10px] text-zinc-500 truncate">Photographer</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1 border-t border-[#1a1a1c]/60">
          <button onClick={() => setActiveTab('feedback')} className="hover:text-amber-500 flex items-center gap-1 transition-colors">
            <MessageSquare className="w-3 h-3" /> Feedback
          </button>
          <span className="text-zinc-800">|</span>
          <button onClick={() => setActiveTab('support')} className="hover:text-amber-500 flex items-center gap-1 transition-colors">
            <PhoneCall className="w-3 h-3" /> Support
          </button>
          <span className="text-zinc-800">|</span>
          <button onClick={onLogout} className="hover:text-red-500 flex items-center gap-1 transition-colors">
            <LogOut className="w-3 h-3" /> Logout
          </button>
        </div>
      </div>
    </div>
  );
}
