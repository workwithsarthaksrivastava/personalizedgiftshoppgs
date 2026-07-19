import React, { useState, useRef, useEffect } from 'react';
import { 
  Zap, 
  Wallet, 
  Music, 
  Bell, 
  Settings, 
  ChevronRight, 
  CheckCircle, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Coins, 
  ShieldAlert, 
  Sparkles, 
  Play, 
  Pause,
  Crown,
  Lock,
  Compass,
  Smile,
  PhoneCall,
  RefreshCw,
  Database,
  Cloud,
  Layers,
  Image,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase, deserializeAlbumFromSupabase } from '../supabase';

/* ========================================================
   DASHBOARD TAB OVERVIEW
   ======================================================== */
export function DashboardOverviewTab({ onNavigateTab, totalAlbums = 0 }: { onNavigateTab: (tab: string) => void, totalAlbums?: number }) {
  const [loading, setLoading] = useState(false);
  const [statsData, setStatsData] = useState({
    totalOnlineAlbums: 0,
    totalOnlineImages: 0,
    totalOnlineSpreads: 0,
    albumsCreatedToday: 0,
    imagesUploadedToday: 0,
    lastSynced: ''
  });

  const syncData = async (showToast = false) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('albums')
        .select('*');

      if (error) {
        throw error;
      }

      const todayStr = new Date().toDateString();
      let totalOnlineAlbums = 0;
      let totalOnlineImages = 0;
      let totalOnlineSpreads = 0;
      let albumsCreatedToday = 0;
      let imagesUploadedToday = 0;

      const fetchedList = (data || []).map(deserializeAlbumFromSupabase);
      fetchedList.forEach((album: any) => {
        totalOnlineAlbums++;
        const spreads = album.spreads || [];
        const spreadsCount = spreads.length || 0;
        totalOnlineSpreads += spreadsCount;

        let imgCountInAlbum = 0;
        if (album.cover_url) imgCountInAlbum++;
        if (album.back_cover_url) imgCountInAlbum++;
        if (album.inner_front_url) imgCountInAlbum++;
        if (album.inner_back_url) imgCountInAlbum++;

        if (Array.isArray(spreads)) {
          spreads.forEach((spread: any) => {
            if (spread.leftImage) imgCountInAlbum++;
            if (spread.rightImage) imgCountInAlbum++;
          });
        }

        totalOnlineImages += imgCountInAlbum;

        if (album.created_at) {
          const albumDate = new Date(album.created_at);
          if (albumDate.toDateString() === todayStr) {
            albumsCreatedToday++;
            imagesUploadedToday += imgCountInAlbum;
          }
        }
      });

      setStatsData({
        totalOnlineAlbums,
        totalOnlineImages,
        totalOnlineSpreads,
        albumsCreatedToday,
        imagesUploadedToday,
        lastSynced: new Date().toLocaleTimeString()
      });

      if (showToast) {
        toast.success(`✨ Dashboard synced! ${totalOnlineAlbums} live albums calculated.`);
      }
    } catch (err: any) {
      console.error('Error syncing with Supabase:', err);
      if (showToast) {
        toast.error('Sync failed: ' + (err.message || 'Unknown error'));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    syncData();
  }, []);

  const ALBUM_LIMIT = 5;
  const IMAGE_LIMIT = 50;

  const albumsRemaining = Math.max(0, ALBUM_LIMIT - statsData.albumsCreatedToday);
  const imagesRemaining = Math.max(0, IMAGE_LIMIT - statsData.imagesUploadedToday);

  const albumProgressPercent = Math.min(100, (statsData.albumsCreatedToday / ALBUM_LIMIT) * 100);
  const imageProgressPercent = Math.min(100, (statsData.imagesUploadedToday / IMAGE_LIMIT) * 100);

  const stats = [
    { label: 'Total Albums', value: statsData.totalOnlineAlbums || totalAlbums, desc: 'Your active published books', color: 'text-amber-500' },
    { label: 'Design Presets', value: '6', desc: 'Custom premium design themes', color: 'text-indigo-500' },
    { label: 'Audio Library', value: '5', desc: 'Preloaded instrumental soundtracks', color: 'text-emerald-500' },
    { label: 'Server Status', value: 'ONLINE', desc: 'Cloud CDN delivery active', color: 'text-teal-500' }
  ];

  const quickLinks = [
    { title: 'Create New Album', desc: 'Configure cover, client info and inner layouts.', tab: 'create-album', icon: Sparkles, color: 'from-amber-500 to-yellow-400' },
    { title: 'Background Scores', desc: 'Browse and preview romantic and festive backing music.', tab: 'music', icon: Music, color: 'from-blue-500 to-indigo-600' }
  ];

  return (
    <div className="space-y-8 text-white font-sans">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#1b1913] to-[#0c0c0e] border border-amber-500/20 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-lg space-y-3">
          <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-500 px-2.5 py-1 rounded-full font-mono font-bold tracking-wider uppercase">
            ⚡ PGS Album Creator
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-wide text-white font-sans">
            Welcome back, <span className="bg-gradient-to-r from-amber-400 to-yellow-200 bg-clip-text text-transparent">Rajesh Kumar</span>!
          </h2>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Manage your digital flipbook albums, customize interactive slideshow canvases, print custom dynamic QR codes, and deliver unforgettable memories to your clients of Personalizedgiftshop.in.
          </p>
          <div className="pt-2">
            <button
              onClick={() => onNavigateTab('create-album')}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded-xl transition-all shadow-lg shadow-amber-500/10 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 fill-black/10" /> Start New Design
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((st) => (
          <div key={st.label} className="bg-[#121214] border border-[#1e1e21] rounded-2xl p-5 shadow-lg space-y-3">
            <span className="text-xs font-bold text-zinc-500 block uppercase tracking-wider">{st.label}</span>
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-extrabold ${st.color}`}>{st.value}</span>
            </div>
            <div className="text-[11px] text-zinc-400 flex flex-col gap-0.5">
              <span className="text-zinc-500 text-[10px]">{st.desc}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Supabase Live Upload Sync & Daily Limits */}
      <div className="bg-[#121214] border border-[#1e1e21] rounded-3xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1a1a1c] pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl border border-amber-500/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-zinc-100 flex items-center gap-2">
                Supabase Live Database & Daily Limits
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10b981]"></span>
                </span>
              </h3>
              <p className="text-[11px] text-zinc-500">Synchronized storage statistics and image limits for today</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {statsData.lastSynced && (
              <span className="text-[10px] text-zinc-500 font-mono">Last synced: {statsData.lastSynced}</span>
            )}
            <button
              onClick={() => syncData(true)}
              disabled={loading}
              className={`px-3 py-1.5 bg-zinc-950 border border-zinc-850 hover:bg-zinc-900 rounded-xl text-zinc-300 hover:text-white transition-all duration-300 flex items-center justify-center gap-2 text-xs font-bold ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-500 ${loading ? 'animate-spin' : ''}`} />
              Sync Now
            </button>
          </div>
        </div>

        {/* Limits Progress Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Album creation limits */}
          <div className="bg-zinc-950/40 border border-zinc-900/60 rounded-2xl p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wide font-mono block">Daily Album Saves</span>
                <span className="text-2xl font-black text-amber-500">{statsData.albumsCreatedToday} <span className="text-xs font-medium text-zinc-500 font-sans">of {ALBUM_LIMIT} used</span></span>
              </div>
              <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-500 px-2.5 py-1 rounded-full font-bold">
                {albumsRemaining} left today
              </span>
            </div>

            {/* Progress bar */}
            <div className="space-y-1.5">
              <div className="w-full bg-[#18181b] h-2.5 rounded-full overflow-hidden border border-zinc-900">
                <div 
                  className="bg-amber-500 h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(245,158,11,0.3)]"
                  style={{ width: `${albumProgressPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-zinc-500 font-medium">
                <span>0%</span>
                <span>{albumProgressPercent.toFixed(0)}% used</span>
                <span>100%</span>
              </div>
            </div>

            {albumsRemaining === 0 && (
              <div className="flex items-center gap-2 p-3 bg-rose-500/5 border border-rose-500/20 rounded-xl text-[11px] text-rose-400">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>Daily album creation limit reached! It resets at midnight.</span>
              </div>
            )}
          </div>

          {/* Image upload limits */}
          <div className="bg-zinc-950/40 border border-zinc-900/60 rounded-2xl p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wide font-mono block">Daily Image Uploads</span>
                <span className="text-2xl font-black text-amber-500">{statsData.imagesUploadedToday} <span className="text-xs font-medium text-zinc-500 font-sans">of {IMAGE_LIMIT} used</span></span>
              </div>
              <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-500 px-2.5 py-1 rounded-full font-bold">
                {imagesRemaining} left today
              </span>
            </div>

            {/* Progress bar */}
            <div className="space-y-1.5">
              <div className="w-full bg-[#18181b] h-2.5 rounded-full overflow-hidden border border-zinc-900">
                <div 
                  className="bg-amber-500 h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(245,158,11,0.3)]"
                  style={{ width: `${imageProgressPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-zinc-500 font-medium">
                <span>0%</span>
                <span>{imageProgressPercent.toFixed(0)}% used</span>
                <span>100%</span>
              </div>
            </div>

            {imagesRemaining === 0 && (
              <div className="flex items-center gap-2 p-3 bg-rose-500/5 border border-rose-500/20 rounded-xl text-[11px] text-rose-400">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>Daily image limit reached! It resets at midnight.</span>
              </div>
            )}
          </div>
        </div>

        {/* Database Upload Totals Summary Footer */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-[#1a1a1c]/60">
          <div className="flex items-center gap-3 p-3 bg-[#0a0a0c] border border-zinc-900 rounded-xl">
            <Database className="w-4 h-4 text-amber-500 shrink-0" />
            <div>
              <span className="text-[10px] text-zinc-500 uppercase tracking-wide font-bold font-mono block">Supabase Albums</span>
              <span className="text-sm font-extrabold text-white">{statsData.totalOnlineAlbums} online</span>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-[#0a0a0c] border border-zinc-900 rounded-xl">
            <Layers className="w-4 h-4 text-indigo-400 shrink-0" />
            <div>
              <span className="text-[10px] text-zinc-500 uppercase tracking-wide font-bold font-mono block">Designed Spreads</span>
              <span className="text-sm font-extrabold text-white">{statsData.totalOnlineSpreads} spreads</span>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-[#0a0a0c] border border-zinc-900 rounded-xl">
            <Image className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <span className="text-[10px] text-zinc-500 uppercase tracking-wide font-bold font-mono block">Total Photos Hosted</span>
              <span className="text-sm font-extrabold text-white">{statsData.totalOnlineImages} images</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Launch & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Quick Launch Cards */}
        <div className="lg:col-span-7 space-y-4">
          <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider font-mono">Quick Utilities</h3>
          <div className="grid grid-cols-1 gap-4">
            {quickLinks.map((link) => {
              const Icon = link.icon;
              return (
                <div 
                  key={link.title}
                  onClick={() => onNavigateTab(link.tab)}
                  className="bg-[#121214] border border-[#1e1e21] hover:border-amber-500/30 p-5 rounded-2xl flex items-center justify-between cursor-pointer group transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-tr ${link.color} flex items-center justify-center text-black`}>
                      <Icon className="w-5.5 h-5.5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-zinc-100 group-hover:text-amber-500 transition-colors text-sm">{link.title}</h4>
                      <p className="text-zinc-500 text-xs mt-0.5">{link.desc}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-white transition-colors" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Deliver checklist instead of live activity */}
        <div className="lg:col-span-5 bg-[#121214] border border-[#1e1e21] rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider font-mono">Delivery Checklist</h3>
            <span className="text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">Active</span>
          </div>
          
          <div className="space-y-4">
            {[
              { text: "Upload cover with custom branding", desc: "Set your photographer signature & watermark" },
              { text: "Add beautiful layout sheets", desc: "Combine multiple portrait photos per spread" },
              { text: "Select a custom background theme", desc: "Make the presentation experience immersive" },
              { text: "Generate high-quality QR codes", desc: "Print QR stamps for easy client access" }
            ].map((item, i) => (
              <div key={i} className="flex gap-3 items-start text-xs border-b border-zinc-900/40 pb-3 last:border-0 last:pb-0">
                <div className="w-5 h-5 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500 font-mono text-[10px] font-bold mt-0.5 shrink-0">
                  ✓
                </div>
                <div>
                  <p className="text-zinc-200 font-bold leading-normal">{item.text}</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


/* ========================================================
   RECHARGE TAB
   ======================================================== */
export function RechargeTab({ onRecharge }: { onRecharge: (coins: number) => void }) {
  const packs = [
    { id: 'pack1', title: 'Starter Pack', coins: 100, price: '₹999', costPerCoin: '₹10/coin', popular: false, desc: 'Ideal for wedding season startup testers.' },
    { id: 'pack2', title: 'Studio Choice', coins: 500, price: '₹3,999', costPerCoin: '₹8/coin', popular: true, desc: 'Best value for active local photography studios.' },
    { id: 'pack3', title: 'Agency Elite', coins: 2000, price: '₹11,999', costPerCoin: '₹6/coin', popular: false, desc: 'For high-volume multi-team media planners.' }
  ];

  return (
    <div className="space-y-8 text-white font-sans">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-wide">Coin Recharge Center</h2>
        <p className="text-zinc-400 text-sm leading-relaxed">Top up your balance instantly to publish new flipbook projects. Each album requires 5 coins to publish and remains hosted for life!</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {packs.map((pk) => (
          <div 
            key={pk.id} 
            className={`border rounded-3xl p-6 flex flex-col justify-between relative shadow-xl bg-[#121214] transition-all hover:scale-[1.02] ${
              pk.popular 
                ? 'border-amber-500 shadow-amber-500/5 ring-1 ring-amber-500/25' 
                : 'border-[#1e1e21]'
            }`}
          >
            {pk.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-black text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                Most Popular
              </span>
            )}
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-white">{pk.title}</h3>
                <p className="text-zinc-500 text-xs mt-1 leading-relaxed">{pk.desc}</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Coins className="w-6 h-6 text-amber-500" />
                  <span className="text-3xl font-extrabold text-white">{pk.coins}</span>
                  <span className="text-zinc-400 text-sm font-medium">Coins</span>
                </div>
                <span className="text-[10px] text-zinc-500 font-bold block">{pk.costPerCoin}</span>
              </div>
            </div>

            <div className="space-y-3 pt-6 mt-6 border-t border-zinc-900">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-zinc-500 font-medium">Grand Total</span>
                <span className="text-2xl font-black text-amber-500">{pk.price}</span>
              </div>
              <button
                onClick={() => onRecharge(pk.coins)}
                className="w-full py-2.5 bg-zinc-950 border border-zinc-800 hover:bg-amber-500 hover:text-black hover:border-amber-500 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2"
              >
                Buy Instantly <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


/* ========================================================
   WALLET TAB
   ======================================================== */
export function WalletTab({ coinsBalance = 38 }: { coinsBalance?: number }) {
  const [transactions] = useState([
    { id: 'TX-771', type: 'Credit', desc: 'Purchased Studio Choice Pack', coins: '+500', date: 'Jul 18, 2026', status: 'Success' },
    { id: 'TX-724', type: 'Debit', desc: 'Published "Daksh & Pratyush" Album', coins: '-5', date: 'Jul 18, 2026', status: 'Success' },
    { id: 'TX-719', type: 'Debit', desc: 'Published "Mr & Mis" Album', coins: '-5', date: 'Jul 15, 2026', status: 'Success' },
    { id: 'TX-691', type: 'Credit', desc: 'Referral Code Bonus (VIP_ASH)', coins: '+10', date: 'Jul 12, 2026', status: 'Success' }
  ]);

  return (
    <div className="space-y-8 text-white font-sans">
      <div className="bg-gradient-to-br from-[#1b1913] to-[#0c0c0e] border border-zinc-800 p-6 sm:p-8 rounded-3xl flex flex-col sm:flex-row justify-between items-center gap-6 shadow-xl relative">
        <div className="space-y-2 text-center sm:text-left">
          <h2 className="text-lg font-bold text-zinc-400">Available Wallet Balance</h2>
          <div className="flex items-center gap-3 justify-center sm:justify-start">
            <Coins className="w-8 h-8 text-amber-500 fill-amber-500/20" />
            <span className="text-4xl font-black text-white">{coinsBalance}</span>
            <span className="text-zinc-500 text-sm font-semibold">Coins remaining</span>
          </div>
        </div>

        <button 
          onClick={() => toast.success('Redirecting to fast checkout gateway...')}
          className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-extrabold rounded-xl text-xs transition-all shadow-md shadow-amber-500/15"
        >
          Add Coins +
        </button>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider font-mono">Transaction Ledgers</h3>
        
        <div className="bg-[#121214] border border-[#1e1e21] rounded-2xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-300">
              <thead>
                <tr className="border-b border-[#1e1e21] text-zinc-500 text-xs tracking-wider uppercase bg-zinc-950/20">
                  <th className="py-3 px-4 font-semibold">Transaction ID</th>
                  <th className="py-3 px-4 font-semibold">Description</th>
                  <th className="py-3 px-4 font-semibold">Date</th>
                  <th className="py-3 px-4 font-semibold text-center">Coins Change</th>
                  <th className="py-3 px-4 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e1e21]">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-zinc-900/20 transition-all">
                    <td className="py-3.5 px-4 font-mono text-xs text-zinc-400">{tx.id}</td>
                    <td className="py-3.5 px-4 font-semibold text-zinc-100">{tx.desc}</td>
                    <td className="py-3.5 px-4 text-xs text-zinc-500">{tx.date}</td>
                    <td className={`py-3.5 px-4 text-center font-bold font-sans ${tx.coins.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {tx.coins}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-bold">
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}


/* ========================================================
   MUSIC PREVIEW TAB
   ======================================================== */
export function MusicTab() {
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const songs = [
    { id: 's1', title: 'Traditional Royal Shehnai', mood: 'Traditional, grand, auspicious', duration: '2:40', artist: 'Sarang Dev', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
    { id: 's2', title: 'Romantic Acoustic Sitar', mood: 'Calm, sweet, cinematic', duration: '3:12', artist: 'Aditi Sen', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
    { id: 's3', title: 'Devotional Sacred Flute', mood: 'Ethereal, spiritual, ambient', duration: '4:05', artist: 'Hari Prasad', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
    { id: 's4', title: 'Festive Punjabi Dhol Beats', mood: 'Lively, joyful, high energy', duration: '1:55', artist: 'Dhol Squad', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
    { id: 's5', title: 'Modern Elegance Piano Solo', mood: 'Sophisticated, classic, emotional', duration: '3:44', artist: 'Piano Dreamer', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3' }
  ];

  const togglePlay = (song: typeof songs[0]) => {
    if (playingTrackId === song.id) {
      audioRef.current?.pause();
      setPlayingTrackId(null);
    } else {
      if (!audioRef.current) {
        audioRef.current = new Audio(song.url);
      } else {
        audioRef.current.src = song.url;
      }
      audioRef.current.play().catch(e => toast.error('Preview error - check connection'));
      setPlayingTrackId(song.id);
      toast.success(`🔊 Preview playing: ${song.title}`);
    }
  };

  return (
    <div className="space-y-8 text-white font-sans">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-wide">Royalty-Free Audio Library</h2>
        <p className="text-zinc-400 text-sm leading-relaxed">Preview and listen to elegant traditional instrumentals and cinematic background scores curated for luxury wedding albums.</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {songs.map((song) => (
          <div key={song.id} className="bg-[#121214] border border-[#1e1e21] rounded-2xl p-4 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-4">
              <button
                onClick={() => togglePlay(song)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  playingTrackId === song.id 
                    ? 'bg-rose-500 text-white animate-pulse shadow-md shadow-rose-500/10' 
                    : 'bg-[#1e1e21] text-amber-500 hover:bg-[#252529]'
                }`}
              >
                {playingTrackId === song.id ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-amber-500" />}
              </button>
              
              <div>
                <h3 className="font-bold text-sm text-zinc-100">{song.title}</h3>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-zinc-500 mt-0.5">
                  <span className="font-medium text-amber-500">{song.artist}</span>
                  <span>•</span>
                  <span>Mood: <span className="text-zinc-400">{song.mood}</span></span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-zinc-600 font-mono">{song.duration}</span>
              <button
                onClick={() => {
                  toast.success(`⭐️ Selected "${song.title}" as default preset watermark audio!`);
                }}
                className="px-3 py-1.5 bg-[#1e1e21] border border-zinc-800 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold rounded-lg transition-colors"
              >
                Use Preset
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


/* ========================================================
   NOTIFICATIONS TAB
   ======================================================== */
export function NotificationsTab() {
  const alerts = [
    { title: 'New Customer Album View', desc: 'Client "Akash & Ambika" just scanned their dynamic QR and opened spread 4 in Mumbai.', time: '12m ago', read: false },
    { title: 'Coin Recharge Approved', desc: 'We have received your payment of ₹3,999. 500 Coins have been successfully credited to your wallet.', time: '3h ago', read: false },
    { title: 'System Security Protocol Alert', desc: 'Watermark water-shield version 4.2 has been deployed to prevent image right-click saving across all public viewer urls.', time: '1d ago', read: true },
    { title: 'New Referral Registered', desc: 'Photographer "Amit Studio" registered using your link. You received 10 Coins bonus!', time: '2d ago', read: true }
  ];

  return (
    <div className="space-y-8 text-white font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-wide">Studio Notifications</h2>
          <p className="text-zinc-400 text-sm leading-relaxed mt-1">Stay updated with instant client viewing statistics, QR scans, payment history, and hosting statuses.</p>
        </div>
        <button 
          onClick={() => toast.success('All marked as read!')}
          className="text-xs font-bold text-amber-500 hover:underline"
        >
          Mark all as read
        </button>
      </div>

      <div className="space-y-4">
        {alerts.map((al, idx) => (
          <div key={idx} className={`border rounded-2xl p-5 flex items-start gap-4 shadow-sm bg-[#121214] ${!al.read ? 'border-amber-500/25 ring-1 ring-amber-500/10' : 'border-[#1e1e21]'}`}>
            <div className={`p-2 rounded-xl shrink-0 ${!al.read ? 'bg-amber-500/15 text-amber-500' : 'bg-[#1e1e21] text-zinc-500'}`}>
              <Bell className="w-5 h-5" />
            </div>

            <div className="flex-grow space-y-1">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-zinc-100">{al.title}</h3>
                <span className="text-[10px] text-zinc-500">{al.time}</span>
              </div>
              <p className="text-zinc-400 text-xs leading-relaxed">{al.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


/* ========================================================
   SETTINGS TAB
   ======================================================== */
export function SettingsTab() {
  const [studioName, setStudioName] = useState('Rajesh Kumar / Photographer');
  const [watermark, setWatermark] = useState('#SuryaFilms2026');

  const handleSave = () => {
    toast.success('⚙️ Global studio settings updated successfully!');
  };

  return (
    <div className="space-y-8 text-white font-sans max-w-xl">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-wide">Studio Configuration</h2>
        <p className="text-zinc-400 text-sm leading-relaxed">Customize your public photographer metadata, logo presets, default watermarks, and security access defaults.</p>
      </div>

      <div className="bg-[#121214] border border-[#1e1e21] rounded-3xl p-5 sm:p-6 space-y-5 shadow-2xl">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-400">Default Studio Signature</label>
          <input
            type="text"
            value={studioName}
            onChange={(e) => setStudioName(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-[#09090b] border border-zinc-800 rounded-xl focus:border-amber-500/50 outline-none text-sm text-zinc-100"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-400">Default Watermark Text</label>
          <input
            type="text"
            value={watermark}
            onChange={(e) => setWatermark(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-[#09090b] border border-zinc-800 rounded-xl focus:border-amber-500/50 outline-none text-sm text-zinc-100"
          />
        </div>

        <div className="space-y-2 pt-2 border-t border-zinc-900">
          <label className="text-xs font-semibold text-zinc-400">Default Client Access Mode</label>
          <select className="w-full px-3.5 py-2.5 bg-[#09090b] border border-zinc-800 rounded-xl outline-none text-sm text-zinc-300">
            <option>Publicly Shareable (recommended)</option>
            <option>Private PIN Protection Required</option>
          </select>
        </div>

        <button
          onClick={handleSave}
          className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-extrabold rounded-xl text-xs transition-all shadow-md shadow-amber-500/15"
        >
          Save Studio Profile
        </button>
      </div>
    </div>
  );
}


/* ========================================================
   FEEDBACK & SUPPORT SIMPLE MOCK TABS
   ======================================================== */
export function FeedbackTab() {
  const [text, setText] = useState('');
  return (
    <div className="space-y-6 text-white font-sans max-w-lg">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-wide flex items-center gap-2"><Smile className="text-amber-500" /> Share Feedback</h2>
        <p className="text-zinc-400 text-sm leading-relaxed">Help us improve the PGS Album experience for wedding media crews.</p>
      </div>
      <div className="bg-[#121214] border border-[#1e1e21] rounded-3xl p-6 space-y-4 shadow-xl">
        <textarea
          rows={5}
          placeholder="What features or tools would you like to see next?"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full p-4 bg-[#09090b] border border-zinc-800 rounded-2xl focus:border-amber-500/50 outline-none text-sm"
        />
        <button
          onClick={() => {
            if (!text.trim()) return toast.error('Please write something first!');
            toast.success('Thank you for your valuable input! Rajesh Kumar');
            setText('');
          }}
          className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-extrabold rounded-xl text-xs transition-all"
        >
          Submit Feedback
        </button>
      </div>
    </div>
  );
}

export function SupportTab() {
  return (
    <div className="space-y-6 text-white font-sans max-w-lg">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-wide flex items-center gap-2"><PhoneCall className="text-amber-500" /> Professional Support</h2>
        <p className="text-zinc-400 text-sm leading-relaxed">Connect with our engineering and accounts squad instantly.</p>
      </div>
      <div className="bg-[#121214] border border-[#1e1e21] p-6 rounded-3xl space-y-4 shadow-xl">
        <div className="p-4 bg-zinc-950 border border-zinc-850 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 font-bold uppercase">Dedicated Hotline</p>
            <p className="text-sm font-extrabold text-amber-500 font-mono mt-0.5">+91 99887 76655</p>
          </div>
          <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-bold">ONLINE</span>
        </div>
        <p className="text-xs text-zinc-400 leading-normal">Our dedicated helpline operates from 10:00 AM to 08:00 PM (IST) Monday through Saturday to ensure your wedding presentation displays flawlessly.</p>
      </div>
    </div>
  );
}
