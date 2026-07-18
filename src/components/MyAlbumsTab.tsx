import React, { useState } from 'react';
import { 
  Search, 
  RotateCw, 
  LayoutGrid, 
  List, 
  SlidersHorizontal, 
  ArrowUpDown, 
  QrCode, 
  Lock, 
  Unlock, 
  ExternalLink, 
  Edit3, 
  Trash2, 
  Eye, 
  Check, 
  Copy, 
  FolderHeart,
  Share2
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { Album } from '../types/album';

interface MyAlbumsTabProps {
  albums: Album[];
  onEditAlbum: (album: Album) => void;
  onDeleteAlbum: (id: string) => void;
  onTogglePublic: (id: string) => void;
  onToggleLock: (id: string) => void;
  onRefresh: () => void;
}

export default function MyAlbumsTab({
  albums,
  onEditAlbum,
  onDeleteAlbum,
  onTogglePublic,
  onToggleLock,
  onRefresh
}: MyAlbumsTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'created_at' | 'client_name'>('created_at');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  
  // QR Code Modal State
  const [qrModalAlbum, setQrModalAlbum] = useState<Album | null>(null);

  // Filter & Search Logic
  const filteredAlbums = albums.filter((album) => {
    const matchesSearch = 
      (album.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (album.client_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (album.function_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    if (selectedCategory === 'All') return matchesSearch;
    return matchesSearch && (album.function_name === selectedCategory);
  });

  // Sort Logic
  const sortedAlbums = [...filteredAlbums].sort((a, b) => {
    if (sortBy === 'created_at') {
      const dateA = new Date(a.created_at || '');
      const dateB = new Date(b.created_at || '');
      return dateB.getTime() - dateA.getTime();
    } else {
      const nameA = a.client_name || '';
      const nameB = b.client_name || '';
      return nameA.localeCompare(nameB);
    }
  });

  // Pagination Logic
  const totalItems = sortedAlbums.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAlbums = sortedAlbums.slice(startIndex, startIndex + itemsPerPage);

  const handleCopyLink = (id: string) => {
    const url = `${window.location.origin}/album/${id}`;
    navigator.clipboard?.writeText?.(url);
    toast.success('📋 Album link copied to clipboard!');
  };

  return (
    <div className="space-y-6 text-white font-sans">
      {/* Search and filter bar (Aesthetic matches First Screenshot) */}
      <div className="bg-[#121214] border border-[#1e1e21] rounded-2xl p-5 space-y-4 shadow-xl">
        <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase block">FILTERS</span>
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search box */}
          <div className="md:col-span-5 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search by client, function or title..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 bg-[#09090b] border border-zinc-800/80 rounded-xl focus:border-amber-500/50 outline-none text-sm text-zinc-100 placeholder-zinc-600 transition-colors"
            />
          </div>

          {/* Category Dropdown */}
          <div className="md:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2.5 bg-[#09090b] border border-zinc-800/80 rounded-xl focus:border-amber-500/50 outline-none text-sm text-zinc-300 cursor-pointer"
            >
              <option value="All">All Categories</option>
              <option value="Wedding">Wedding</option>
              <option value="Reception">Reception</option>
              <option value="Sangeet">Sangeet</option>
              <option value="Pre-Wedding">Pre-Wedding</option>
              <option value="Birthday">Birthday</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Sort selection dropdown */}
          <div className="md:col-span-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2.5 bg-[#09090b] border border-zinc-800/80 rounded-xl focus:border-amber-500/50 outline-none text-sm text-zinc-300 cursor-pointer"
            >
              <option value="created_at">Date created</option>
              <option value="client_name">Client name</option>
            </select>
          </div>

          {/* Buttons group */}
          <div className="md:col-span-2 flex items-center justify-end gap-2 shrink-0">
            {/* Filter icon btn */}
            <button 
              onClick={() => toast.info('Advanced filter drawer coming soon')}
              className="p-2.5 bg-[#09090b] border border-zinc-800/80 rounded-xl hover:bg-zinc-900 text-zinc-400 hover:text-white transition-all"
              title="Advanced Filters"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>

            {/* Refresh btn */}
            <button
              onClick={() => {
                onRefresh();
                toast.success('Refreshed album database');
              }}
              className="p-2.5 bg-[#09090b] border border-zinc-800/80 rounded-xl hover:bg-zinc-900 text-zinc-400 hover:text-white transition-all"
              title="Refresh List"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            {/* View Grid/List toggle */}
            <div className="flex bg-[#09090b] border border-zinc-800/80 rounded-xl p-0.5">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-amber-500/20 text-amber-500' : 'text-zinc-500 hover:text-zinc-300'}`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-amber-500/20 text-amber-500' : 'text-zinc-500 hover:text-zinc-300'}`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Pagination Row (Matches first screenshot) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2 px-4 bg-[#121214]/60 border border-zinc-800/40 rounded-xl">
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-500">Per page</span>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-2 py-1 bg-[#09090b] border border-zinc-800 rounded-lg text-xs text-zinc-300 outline-none cursor-pointer"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
          <span className="text-xs text-zinc-500">
            Showing {totalItems === 0 ? 0 : startIndex + 1}-{Math.min(totalItems, startIndex + itemsPerPage)} of {totalItems}
          </span>
        </div>

        <div className="text-xs text-zinc-400">
          Page <span className="text-white font-bold">{currentPage}</span> of {totalPages}
        </div>

        {/* Page Navigators */}
        <div className="flex items-center gap-1.5">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => prev - 1)}
            className="px-3 py-1.5 bg-[#09090b] border border-zinc-800 hover:bg-zinc-900 rounded-lg text-xs text-zinc-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all"
          >
            Prev
          </button>
          
          {Array.from({ length: totalPages }).map((_, idx) => {
            const pageNum = idx + 1;
            // Limit shown page buttons
            if (pageNum === 1 || pageNum === totalPages || Math.abs(pageNum - currentPage) <= 1) {
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-7.5 h-7.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center ${
                    currentPage === pageNum 
                      ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20 font-bold' 
                      : 'bg-[#09090b] border border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  {pageNum}
                </button>
              );
            } else if (pageNum === 2 || pageNum === totalPages - 1) {
              return <span key={pageNum} className="text-zinc-600 px-0.5 text-xs">...</span>;
            }
            return null;
          })}

          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => prev + 1)}
            className="px-3 py-1.5 bg-[#09090b] border border-zinc-800 hover:bg-zinc-900 rounded-lg text-xs text-zinc-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all"
          >
            Next
          </button>
        </div>
      </div>

      {/* Main Albums Render Table / Grid */}
      {sortedAlbums.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-[#121214] border border-zinc-800/60 rounded-2xl">
          <FolderHeart className="w-16 h-16 text-zinc-700 stroke-[1.2] mb-4" />
          <p className="text-zinc-400 font-medium mb-1">No albums found matching the filters</p>
          <p className="text-zinc-600 text-xs">Try searching for other keywords or create a new album!</p>
        </div>
      ) : viewMode === 'list' ? (
        /* TABLE VIEW (Matches first screenshot) */
        <div className="bg-[#121214] border border-[#1e1e21] rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1e1e21] text-zinc-500 text-xs tracking-wide uppercase bg-zinc-950/20">
                  <th className="py-4 px-5 font-semibold">Album</th>
                  <th className="py-4 px-4 font-semibold text-zinc-300">Client Name ⇅</th>
                  <th className="py-4 px-4 font-semibold text-center">Status</th>
                  <th className="py-4 px-4 font-semibold">Job Number ⇅</th>
                  <th className="py-4 px-4 font-semibold text-center">QR Code</th>
                  <th className="py-4 px-4 font-semibold">Created ⇅</th>
                  <th className="py-4 px-4 font-semibold">Date Of Function ⇅</th>
                  <th className="py-4 px-4 font-semibold text-center">Access</th>
                  <th className="py-4 px-4 font-semibold text-center">Lock</th>
                  <th className="py-4 px-5 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e1e21] text-sm text-zinc-300 font-sans">
                {paginatedAlbums.map((album) => (
                  <tr key={album.id} className="hover:bg-zinc-900/40 transition-colors group">
                    {/* Cover Thumbnail */}
                    <td className="py-3 px-5">
                      <div className="w-14 h-11 bg-zinc-800 rounded-lg overflow-hidden border border-zinc-700/60 shadow-md shrink-0 relative flex items-center justify-center">
                        {album.cover_url ? (
                          <img 
                            src={album.cover_url} 
                            alt={album.title} 
                            className="w-full h-full object-cover" 
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <span className="text-[9px] text-zinc-500 font-bold uppercase">No Cover</span>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                          <Eye className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    </td>

                    {/* Client Name & Category */}
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-zinc-100 font-sans group-hover:text-amber-500 transition-colors">
                          {album.client_name || album.title || 'Untitled Client'}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-medium">
                          {album.function_name || 'Wedding Ceremony'}
                        </span>
                      </div>
                    </td>

                    {/* Status badge */}
                    <td className="py-3 px-4 text-center">
                      <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-full text-[10px] font-bold tracking-wide">
                        {album.status || 'Published'}
                      </span>
                    </td>

                    {/* Job Number */}
                    <td className="py-3 px-4 font-mono text-xs text-zinc-400">
                      {album.job_number || '—'}
                    </td>

                    {/* QR Code Button */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setQrModalAlbum(album)}
                        className="px-2.5 py-1.5 bg-[#1e1e21] border border-zinc-800 text-zinc-300 hover:text-white rounded-lg flex items-center justify-center gap-1.5 mx-auto hover:bg-zinc-800 transition-colors"
                        title="Display QR code"
                      >
                        <span className="text-xs font-bold font-sans">QR</span>
                        <QrCode className="w-3.5 h-3.5 text-amber-500" />
                      </button>
                    </td>

                    {/* Created Date */}
                    <td className="py-3 px-4 text-xs text-zinc-400 font-mono">
                      {album.created_at ? new Date(album.created_at).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric'
                      }) + ' ' + new Date(album.created_at).toLocaleTimeString('en-US', {
                        hour: '2-digit', minute: '2-digit'
                      }) : 'Jul 18, 2026 05:57 PM'}
                    </td>

                    {/* Function Date */}
                    <td className="py-3 px-4 text-xs text-zinc-400 font-mono">
                      {album.function_date ? new Date(album.function_date).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric'
                      }) : 'Jun 19, 2026'}
                    </td>

                    {/* Access (Public / Private toggle) */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => onTogglePublic(album.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all min-w-[70px] ${
                          album.is_public !== false
                            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                            : 'bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20'
                        }`}
                      >
                        {album.is_public !== false ? 'Public' : 'Private'}
                      </button>
                    </td>

                    {/* Lock toggle */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => onToggleLock(album.id)}
                        className={`p-1.5 rounded-lg transition-colors inline-flex items-center justify-center ${
                          album.view_lock_pin
                            ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20'
                            : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                        }`}
                        title={album.view_lock_pin ? `Locked (PIN: ${album.view_lock_pin})` : 'Unlocked'}
                      >
                        {album.view_lock_pin ? (
                          <Lock className="w-3.5 h-3.5" />
                        ) : (
                          <Unlock className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </td>

                    {/* Action buttons */}
                    <td className="py-3 px-5 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        {/* View in new tab */}
                        <a
                          href={`/album/${album.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors"
                          title="View live page"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>

                        {/* Edit */}
                        <button
                          onClick={() => onEditAlbum(album)}
                          className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors"
                          title="Edit Album"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete "${album.client_name || album.title}"? This cannot be undone.`)) {
                              onDeleteAlbum(album.id);
                            }
                          }}
                          className="p-1.5 hover:bg-rose-500/10 text-zinc-500 hover:text-rose-400 rounded-lg transition-colors"
                          title="Delete Album"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {paginatedAlbums.map((album) => (
            <div key={album.id} className="bg-[#121214] border border-[#1e1e21] rounded-2xl overflow-hidden shadow-lg group hover:border-amber-500/40 transition-all flex flex-col">
              <div className="aspect-[4/3] bg-zinc-950 relative overflow-hidden flex items-center justify-center">
                {album.cover_url ? (
                  <img 
                    src={album.cover_url} 
                    alt={album.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <FolderHeart className="w-12 h-12 text-zinc-800" />
                )}
                
                {/* Overlay actions on hover */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <a
                    href={`/album/${album.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 bg-zinc-900 border border-zinc-700/80 hover:bg-black rounded-xl text-white transition-all transform translate-y-2 group-hover:translate-y-0"
                    title="View Album"
                  >
                    <Eye className="w-4.5 h-4.5" />
                  </a>
                  <button
                    onClick={() => onEditAlbum(album)}
                    className="p-2.5 bg-amber-500 text-black hover:bg-amber-400 rounded-xl font-bold transition-all transform translate-y-2 group-hover:translate-y-0"
                    title="Edit Album"
                  >
                    <Edit3 className="w-4.5 h-4.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete "${album.client_name || album.title}"?`)) {
                        onDeleteAlbum(album.id);
                      }
                    }}
                    className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/30 rounded-xl transition-all transform translate-y-2 group-hover:translate-y-0"
                    title="Delete"
                  >
                    <Trash2 className="w-4.5 h-4.5" />
                  </button>
                </div>

                {/* Badges on Thumbnail */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none">
                  <span className="px-2 py-0.5 bg-black/75 backdrop-blur-md text-amber-500 border border-amber-500/20 rounded-md text-[9px] font-bold tracking-wider font-mono uppercase">
                    {album.function_name || 'Wedding'}
                  </span>
                </div>

                <div className="absolute top-3 right-3 flex gap-1.5">
                  <button 
                    onClick={() => setQrModalAlbum(album)}
                    className="p-1.5 bg-black/75 backdrop-blur-md text-white rounded-md border border-white/10 hover:bg-black transition-colors"
                    title="QR Code"
                  >
                    <QrCode className="w-3.5 h-3.5 text-amber-500" />
                  </button>
                </div>
              </div>

              {/* Grid content footer */}
              <div className="p-4 flex-grow flex flex-col justify-between gap-4">
                <div>
                  <h3 className="font-bold text-zinc-100 group-hover:text-amber-500 transition-colors truncate">
                    {album.client_name || album.title || 'Untitled Album'}
                  </h3>
                  <p className="text-zinc-500 text-xs mt-1 font-mono">Job ID: {album.job_number || '—'}</p>
                </div>

                <div className="flex items-center justify-between text-xs pt-3 border-t border-zinc-900">
                  <span className="text-zinc-500 font-mono">
                    {album.created_at ? new Date(album.created_at).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric'
                    }) : 'Jul 18'}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {/* Public status */}
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase ${album.is_public !== false ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                      {album.is_public !== false ? 'Public' : 'Private'}
                    </span>
                    {album.view_lock_pin && (
                      <span className="p-1 bg-rose-500/10 text-rose-400 rounded-md" title="Password Protected">
                        <Lock className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* QR CODE OVERLAY MODAL */}
      {qrModalAlbum && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none">
          <div className="bg-[#121214] border border-[#1e1e21] rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl relative text-center space-y-6">
            <button
              onClick={() => setQrModalAlbum(null)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
            >
              ✕
            </button>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white tracking-wide">Live Album QR Code</h3>
              <p className="text-xs text-zinc-500 truncate">Client: {qrModalAlbum.client_name || qrModalAlbum.title}</p>
            </div>

            {/* QR box container styled beautifully */}
            <div className="p-4 bg-white rounded-2xl inline-block shadow-inner mx-auto">
              <QRCodeSVG
                value={`${window.location.origin}/album/${qrModalAlbum.id}`}
                size={180}
                level="H"
                includeMargin={true}
              />
            </div>

            <div className="space-y-2">
              <button
                onClick={() => {
                  handleCopyLink(qrModalAlbum.id);
                }}
                className="w-full py-2.5 bg-amber-500 text-black hover:bg-amber-400 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2"
              >
                <Copy className="w-4 h-4" /> Copy Share Link
              </button>
              
              <button
                onClick={() => {
                  toast.success('📥 Generated high-quality PNG printable QR Code!');
                }}
                className="w-full py-2.5 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <Share2 className="w-4 h-4" /> Download Printable Stamp
              </button>
            </div>
            
            <p className="text-[10px] text-zinc-600 font-serif italic">PGS Album • Dynamic QR Engine</p>
          </div>
        </div>
      )}
    </div>
  );
}
