import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, serializeAlbumForSupabase, deserializeAlbumFromSupabase } from '../../supabase';
import { toast } from 'sonner';
import { Album, Spread } from '../../types/album';

// Modular Components
import DashboardSidebar from '../../components/DashboardSidebar';
import DashboardHeader from '../../components/DashboardHeader';
import MyAlbumsTab from '../../components/MyAlbumsTab';
import CreateAlbumTab from '../../components/CreateAlbumTab';
import { 
  DashboardOverviewTab, 
  MusicTab, 
  NotificationsTab, 
  SettingsTab,
  FeedbackTab,
  SupportTab
} from '../../components/DashboardTabs';

// Live user albums database and dynamic creator

const initialBlankAlbum = (): Album => ({
  id: '',
  title: 'My Celebration Album',
  client_name: '',
  function_name: 'Wedding',
  function_date: new Date().toISOString().split('T')[0],
  audio_url: '',
  audio_name: '',
  cover_url: '',
  back_cover_url: '',
  inner_front_url: '',
  inner_back_url: '',
  combined_inner_url: '',
  is_combined_inner: false,
  orientation: 'Landscape',
  page_marking: '',
  template: 'Classic Royal',
  spreads: [
    {
      id: 1,
      leftImage: '',
      rightImage: '',
      leftPageType: 'single',
      rightPageType: 'single',
      leftCanvasImages: [],
      rightCanvasImages: []
    }
  ]
});

export default function AlbumStudio() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>(() => {
    return sessionStorage.getItem('studio_active_tab') || 'my-albums';
  });
  const [isSaving, setIsSaving] = useState(false);

  // Database of albums in state
  const [albums, setAlbums] = useState<Album[]>([]);
  // The active album that is loaded in the editor
  const [activeAlbum, setActiveAlbum] = useState<Album>(() => {
    const saved = sessionStorage.getItem('studio_active_album');
    return saved ? JSON.parse(saved) : initialBlankAlbum();
  });

  // Keep sessionStorage in sync with activeTab and activeAlbum
  useEffect(() => {
    sessionStorage.setItem('studio_active_tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    sessionStorage.setItem('studio_active_album', JSON.stringify(activeAlbum));
  }, [activeAlbum]);

  // Fetch albums from Supabase and integrate local storage / mocks
  const loadAlbums = async () => {
    try {
      const { data, error } = await supabase
        .from('albums')
        .select('*');

      if (error) {
        console.warn("Supabase fetch failed. Falling back to presets and local storage:", error);
      }

      // Read local storage ones too
      const localAlbums: Album[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('album_local_')) {
          try {
            const raw = localStorage.getItem(key);
            if (raw) localAlbums.push(JSON.parse(raw));
          } catch (e) {
            console.error(e);
          }
        }
      }

      const fetchedList = (data || []).map(deserializeAlbumFromSupabase);
      
      // Combine all. Only real user albums!
      let combined = [...fetchedList, ...localAlbums];

      // Sort by created date descending
      combined.sort((a, b) => {
        const dateA = new Date(a.created_at || '');
        const dateB = new Date(b.created_at || '');
        return dateB.getTime() - dateA.getTime();
      });

      setAlbums(combined);
    } catch (err) {
      console.error(err);
      setAlbums([]);
    }
  };

  useEffect(() => {
    loadAlbums();
  }, []);

  // Action: Create New Album
  const handleInitiateCreate = () => {
    setActiveAlbum(initialBlankAlbum());
    setActiveTab('create-album');
  };

  // Action: Edit Existing Album
  const handleEditAlbum = (album: Album) => {
    setActiveAlbum({ ...album });
    setActiveTab('create-album');
    toast.success(`Loaded "${album.client_name || album.title}" inside editor!`);
  };

  // Action: Delete Album
  const handleDeleteAlbum = async (id: string) => {
    try {
      // 1. Delete from Supabase if real
      if (!id.startsWith('local_')) {
        const { error } = await supabase
          .from('albums')
          .delete()
          .eq('id', id);
        if (error) console.warn(error);
      } else {
        localStorage.removeItem('album_' + id);
      }

      // 2. Clear server-side filesystem sync (non-blocking)
      try {
        await fetch(`/album/api/albums?id=${id}`, { method: 'DELETE' });
      } catch (err) {
        console.warn("Local server sync deletion bypassed:", err);
      }

      setAlbums(prev => prev.filter(a => a.id !== id));
      toast.success('Album deleted successfully.');
    } catch (err) {
      toast.error('Failed to delete album.');
    }
  };

  // Action: Toggle Access (Public vs Private)
  const handleTogglePublic = async (id: string) => {
    const album = albums.find(a => a.id === id);
    if (!album) return;

    const updatedPublic = album.is_public === false; // toggle
    
    // Update local state
    setAlbums(prev => prev.map(a => a.id === id ? { ...a, is_public: updatedPublic } : a));

    try {
      const updatedAlbum = { ...album, is_public: updatedPublic };
      if (!id.startsWith('local_')) {
        const serialized = serializeAlbumForSupabase(updatedAlbum);
        await supabase
          .from('albums')
          .update({ page_marking: serialized.page_marking })
          .eq('id', id);
      } else {
        localStorage.setItem('album_' + id, JSON.stringify(updatedAlbum));
      }
      toast.success(`Album is now ${updatedPublic ? 'Publicly shareable' : 'Private'}`);
    } catch (e) {
      console.error(e);
    }
  };

  // Action: Toggle Lock status
  const handleToggleLock = async (id: string) => {
    const album = albums.find(a => a.id === id);
    if (!album) return;

    let updatedPin = '';
    if (!album.view_lock_pin) {
      // Prompt or generate PIN
      const pin = prompt('Set a 4 to 6-digit PIN code to secure this album:', '1234');
      if (pin === null) return;
      if (!pin.trim()) {
        toast.error('PIN cannot be empty!');
        return;
      }
      updatedPin = pin.trim();
    }

    setAlbums(prev => prev.map(a => a.id === id ? { ...a, view_lock_pin: updatedPin } : a));

    try {
      const updatedAlbum = { ...album, view_lock_pin: updatedPin };
      if (!id.startsWith('local_')) {
        const serialized = serializeAlbumForSupabase(updatedAlbum);
        await supabase
          .from('albums')
          .update({ page_marking: serialized.page_marking })
          .eq('id', id);
      } else {
        localStorage.setItem('album_' + id, JSON.stringify(updatedAlbum));
      }
      toast.success(updatedPin ? `🔐 Album password protection set (PIN: ${updatedPin})` : '🔓 Album unlocked');
    } catch (e) {
      console.error(e);
    }
  };

  // Action: Save active album
  const handleSaveActiveAlbum = async () => {
    if (!activeAlbum.client_name?.trim()) {
      toast.error('Please specify a client name before publishing!');
      return;
    }

    setIsSaving(true);

    // Create custom url slug
    const cleanedSlug = activeAlbum.client_name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const finalId = activeAlbum.id ? activeAlbum.id : `${cleanedSlug}-${randomCode}`;

    const isNewAlbum = !activeAlbum.id;
    const newAlbumPayload: Album = {
      ...activeAlbum,
      id: finalId,
      title: `${activeAlbum.client_name}'s Premium Flipbook`,
      status: 'Published',
      job_number: activeAlbum.job_number || `PJ-${Math.floor(10000 + Math.random() * 90000)}`,
      created_at: activeAlbum.created_at || new Date().toISOString()
    };

    const dbPayload = serializeAlbumForSupabase(newAlbumPayload);

    try {
      // 1. Try saving directly to Supabase
      console.log("Saving album to Supabase...", dbPayload);
      
      const query = isNewAlbum 
        ? supabase.from('albums').insert([dbPayload]).select()
        : supabase.from('albums').upsert(dbPayload).select();

      const response = await query;
      
      // LOG SUPABASE RESPONSE EXACTLY AS REQUESTED
      console.log("Supabase response:", { data: response.data, error: response.error });

      const dbError = response.error;

      if (dbError) {
        console.error("Supabase Save Error Details:", dbError);
        toast.error(`Failed to publish online: ${dbError.message || 'Unknown database error'}`);
        
        // Fallback to local storage
        try {
          localStorage.setItem('album_local_' + finalId, JSON.stringify({ ...newAlbumPayload, id: 'local_' + finalId }));
          toast.warning('Offline Save: Saved locally on this browser as a fallback. Share disabled.');
        } catch (storageErr: any) {
          console.error("Local storage fallback failed:", storageErr);
          toast.error(`Local storage fallback also failed: ${storageErr.message || 'Storage limit exceeded'}`);
        }
      } else {
        toast.success('✨ Album published online! Share link or stamp with your client.');
      }

      // 2. Synchronize to Node local disk API (non-blocking)
      try {
        await fetch('/album/api/albums', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newAlbumPayload)
        });
      } catch (err) {
        console.warn("Node local API sync bypassed:", err);
      }

      await loadAlbums();
      setActiveTab('my-albums');
      setActiveAlbum(initialBlankAlbum());
    } catch (err: any) {
      console.error(err);
      toast.error(`Error saving album: ${err.message || 'Please check image sizing is optimized.'}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Action: Open Preview Page
  const handleOpenPreview = () => {
    navigate('/album/preview', { state: { album: activeAlbum } });
  };

  return (
    <div className="flex h-screen bg-[#09090b] text-white overflow-hidden font-sans select-none">
      
      {/* 1. Left Sidebar Navigation */}
      <DashboardSidebar 
        activeTab={activeTab === 'feedback' || activeTab === 'support' ? 'my-albums' : activeTab} 
        setActiveTab={(tab) => {
          if (tab === 'create-album') {
            handleInitiateCreate();
          } else {
            setActiveTab(tab);
          }
        }} 
        onLogout={() => {
          toast.success('Goodbye Rajesh Kumar!');
          navigate('/');
        }}
      />

      {/* 2. Main Portal Container */}
      <div className="flex-grow flex flex-col min-w-0 h-full overflow-hidden bg-[#0c0c0e]">
        
        {/* Header toolbar */}
        <DashboardHeader 
          onBack={activeTab !== 'my-albums' ? () => setActiveTab('my-albums') : undefined} 
          activeTab={activeTab}
        />

        {/* Dynamic Inner views scroll panel */}
        <div className="flex-grow overflow-y-auto p-4 sm:p-6 md:p-8 relative z-10">
          {activeTab === 'dashboard' && (
            <DashboardOverviewTab 
              onNavigateTab={(tab) => {
                if (tab === 'create-album') handleInitiateCreate();
                else setActiveTab(tab);
              }}
              totalAlbums={albums.length}
            />
          )}

          {activeTab === 'my-albums' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold tracking-wide">My Created Albums</h1>
                  <p className="text-xs text-zinc-500 mt-0.5">Browse and manage all published client books and QR stamps</p>
                </div>
                <button
                  onClick={handleInitiateCreate}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded-xl transition-all shadow-md shadow-amber-500/10"
                >
                  Create New Album +
                </button>
              </div>

              <MyAlbumsTab 
                albums={albums}
                onEditAlbum={handleEditAlbum}
                onDeleteAlbum={handleDeleteAlbum}
                onTogglePublic={handleTogglePublic}
                onToggleLock={handleToggleLock}
                onRefresh={loadAlbums}
              />
            </div>
          )}

          {activeTab === 'create-album' && (
            <CreateAlbumTab 
              album={activeAlbum}
              setAlbum={setActiveAlbum}
              onSave={handleSaveActiveAlbum}
              onPreview={handleOpenPreview}
              isSaving={isSaving}
            />
          )}

          {activeTab === 'music' && (
            <MusicTab />
          )}

          {activeTab === 'notifications' && (
            <NotificationsTab />
          )}

          {activeTab === 'settings' && (
            <SettingsTab />
          )}

          {activeTab === 'feedback' && (
            <FeedbackTab />
          )}

          {activeTab === 'support' && (
            <SupportTab />
          )}
        </div>
      </div>
    </div>
  );
}
