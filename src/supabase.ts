import { createClient } from '@supabase/supabase-js';

const supabaseUrl = ((import.meta as any).env.VITE_SUPABASE_URL || '').trim();
const supabaseAnonKey = ((import.meta as any).env.VITE_SUPABASE_ANON_KEY || '').trim();

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder')) {
  const msg = 'Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment variables (Secrets panel in AI Studio or Environment Variables in Vercel).';
  console.error(msg);
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);

export function serializeAlbumForSupabase(album: any): any {
  // Extract only the database columns
  const dbPayload = {
    id: album.id,
    title: album.title || '',
    template: album.template || 'classic',
    audio_url: album.audio_url || '',
    cover_url: album.cover_url || '',
    orientation: album.orientation || 'landscape',
    spreads: album.spreads || [],
    created_at: album.created_at || new Date().toISOString()
  };

  // Package all extra fields into page_marking
  const metadata = {
    audio_name: album.audio_name,
    back_cover_url: album.back_cover_url,
    inner_front_url: album.inner_front_url,
    inner_back_url: album.inner_back_url,
    combined_inner_url: album.combined_inner_url,
    is_combined_inner: album.is_combined_inner,
    client_name: album.client_name,
    function_name: album.function_name,
    function_date: album.function_date,
    view_lock_pin: album.view_lock_pin,
    is_public: album.is_public,
    status: album.status,
    job_number: album.job_number,
    studio_name: album.studio_name,
    photographer_name: album.photographer_name,
    mobile_number: album.mobile_number,
    views_count: album.views_count,
    likes_count: album.likes_count,
    comments: album.comments
  };

  const pageMarkingObj = {
    user_page_marking: album.page_marking || '',
    metadata
  };

  return {
    ...dbPayload,
    page_marking: JSON.stringify(pageMarkingObj)
  };
}

export function deserializeAlbumFromSupabase(dbAlbum: any): any {
  if (!dbAlbum) return dbAlbum;

  let page_marking = dbAlbum.page_marking || '';
  let extraMetadata: any = {};

  if (typeof page_marking === 'string' && (page_marking.startsWith('{') || page_marking.startsWith('['))) {
    try {
      const parsed = JSON.parse(page_marking);
      if (parsed && typeof parsed === 'object') {
        page_marking = parsed.user_page_marking || '';
        if (parsed.metadata) {
          extraMetadata = parsed.metadata;
        }
      }
    } catch (e) {
      // Not JSON or parse failed, keep page_marking as raw text
    }
  }

  return {
    ...dbAlbum,
    ...extraMetadata,
    page_marking
  };
}
