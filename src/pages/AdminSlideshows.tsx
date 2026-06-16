import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Trash2, Plus, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

export default function SlideshowsManagement() {
  const [slides, setSlides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSlideUrl, setNewSlideUrl] = useState('');
  const [newSlideCategory, setNewSlideCategory] = useState('_SLIDESHOW_HOME_');

  const categories = [
    { id: '_SLIDESHOW_HOME_', name: 'Homepage' },
    { id: '_SLIDESHOW_UV_', name: 'Products - UV Printing' },
    { id: '_SLIDESHOW_ALBUM_', name: 'Products - Album Printing' },
    { id: '_SLIDESHOW_FRAME_', name: 'Products - Frame Printing' },
    { id: '_SLIDESHOW_SUBLIMATION_', name: 'Products - Sublimation' }
  ];

  const fetchSlides = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .ilike('category', '%SLIDESHOW%')
      .order('created_at', { ascending: false });
    if (error) {
      console.error("fetchSlides error:", error);
      toast.error(error.message);
    }
    if (data) setSlides(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchSlides();
  }, []);

  const handleAddSlide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSlideUrl) return toast.error('Please enter an image URL');

    const { error } = await supabase.from('products').insert([{
      name: `Slide ${Date.now()}`,
      category: newSlideCategory,
      price: 0,
      image: newSlideUrl,
      description: 'Slideshow Image'
    }]);

    if (error) {
      toast.error('Failed to add slide: ' + error.message);
      console.error(error);
    } else {
      toast.success('Slide added successfully');
      setNewSlideUrl('');
      fetchSlides();
    }
  };

  const handleDeleteSlide = async (id: string) => {
    if (!confirm('Are you sure you want to delete this slide?')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete slide');
    } else {
      toast.success('Slide deleted');
      fetchSlides();
    }
  };

  if (loading) return <div className="p-8 text-white">Loading...</div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Manage Slideshows</h2>
          <p className="text-muted">Add or remove images from the homepage and product category slideshows.</p>
        </div>
      </div>

      <form onSubmit={handleAddSlide} className="glass p-6 rounded-2xl flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 w-full relative">
          <label className="block text-sm font-medium text-white/70 mb-2">Slideshow Location</label>
          <select 
            value={newSlideCategory}
            onChange={(e) => setNewSlideCategory(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none text-white focus:border-gold transition-colors appearance-none"
          >
            {categories.map(c => (
              <option key={c.id} value={c.id} className="bg-bg text-white">{c.name}</option>
            ))}
          </select>
        </div>
        <div className="flex-[2] w-full">
          <label className="block text-sm font-medium text-white/70 mb-2">Image URL</label>
          <input
            type="text"
            required
            placeholder="https://example.com/image.png"
            value={newSlideUrl}
            onChange={e => setNewSlideUrl(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none text-white focus:border-gold transition-colors"
          />
        </div>
        <button type="submit" className="w-full md:w-auto bg-gold text-bg px-6 py-3 rounded-xl font-bold hover:bg-gold/90 transition-all flex items-center justify-center gap-2">
          <Plus className="w-5 h-5" />
          Add Slide
        </button>
      </form>

      <div className="space-y-8">
        {categories.map(cat => {
          const catSlides = slides.filter(s => s.category === cat.id);
          if (catSlides.length === 0) return null;
          
          return (
            <div key={cat.id} className="space-y-4">
              <h3 className="text-xl font-bold text-gold">{cat.name}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {catSlides.map(slide => (
                  <div key={slide.id} className="glass rounded-xl overflow-hidden group relative">
                    <img src={slide.image} alt="slide" className="w-full h-40 object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button 
                        onClick={() => handleDeleteSlide(slide.id)}
                        className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-full transition-transform transform hover:scale-110"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
