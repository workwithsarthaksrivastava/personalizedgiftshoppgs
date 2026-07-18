import { createClient } from "@supabase/supabase-js";

const getSupabaseClient = () => {
  const url = (process.env.VITE_SUPABASE_URL || "").trim();
  const key = (process.env.VITE_SUPABASE_ANON_KEY || "").trim();
  if (!url || !key || url.includes("placeholder")) {
    return null;
  }
  return createClient(url, key);
};

export default async function handler(req, res) {
  const supabase = getSupabaseClient();

  if (req.method === 'GET') {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ success: false, message: 'Album ID is required' });
    }

    try {
      if (!supabase) {
        return res.status(503).json({ success: false, message: 'Database not configured' });
      }

      const { data, error } = await supabase
        .from('albums')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        return res.status(404).json({ success: false, message: 'Album not found' });
      }

      return res.status(200).json({ success: true, data });
    } catch (err) {
      console.error("Error in serverless GET /api/albums:", err);
      return res.status(500).json({ success: false, message: 'Server error fetching album', error: err.message });
    }
  } else if (req.method === 'POST') {
    try {
      if (!supabase) {
        return res.status(503).json({ success: false, message: 'Database not configured' });
      }

      const payload = req.body;
      let id = payload.id;

      if (!id || id === 'preview' || id.startsWith('local_')) {
        id = `album_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      }

      const albumData = {
        title: payload.title,
        template: payload.template || 'classic',
        audio_url: payload.audio_url,
        cover_url: payload.cover_url,
        orientation: payload.orientation || 'landscape',
        page_marking: payload.page_marking,
        spreads: payload.spreads || []
      };

      const { error: upsertError } = await supabase
        .from('albums')
        .upsert({ id, ...albumData });

      if (upsertError) {
        console.error("Supabase upsert error in serverless POST /api/albums:", upsertError);
        return res.status(500).json({ success: false, message: 'Failed to save album to database', error: upsertError.message });
      }

      return res.status(200).json({ success: true, data: { id, ...albumData } });
    } catch (err) {
      console.error("Error in serverless POST /api/albums:", err);
      return res.status(500).json({ success: false, message: 'Server error saving album', error: err.message });
    }
  } else {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
}
