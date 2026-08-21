import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { toast } from 'sonner';
import { Upload, FileCode2, Play, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminPSDTemplates() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('psd_templates')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setTemplates(data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.psd')) {
      toast.error('Please select a valid .psd file');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error('File size exceeds 50MB limit');
      return;
    }

    setUploading(true);
    setProgress(0);
    setProcessing(false);

    try {
      const formData = new FormData();
      formData.append('psdFile', file);

      const progressInterval = setInterval(() => {
        setProgress(p => Math.min(p + 10, 90));
      }, 500);

      const response = await fetch('/api/upload-psd', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setProcessing(true);

      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        throw new Error('Server returned an invalid response (possibly a timeout or file too large).');
      }
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to upload and parse PSD');
      }

      toast.success('PSD parsed successfully!');
      fetchTemplates();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      setProcessing(false);
      setProgress(0);
    }
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    if (e.target) e.target.value = '';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">PSD Templates</h1>
      </div>

      <div 
        className={`bg-bg border p-8 rounded-xl flex flex-col items-center justify-center border-dashed transition-colors ${dragActive ? 'border-gold bg-white/5' : 'border-border'}`}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
        onDrop={handleDrop}
      >
        <Upload className="w-10 h-10 text-muted mb-4" />
        <h3 className="text-lg font-bold text-white mb-2">Upload a PSD File</h3>
        <p className="text-sm text-muted mb-6 text-center max-w-md">
          Upload a Photoshop (.psd) file up to 50MB. Our system will automatically parse the layers, text, and images to make them editable in Frame Studio.
        </p>
        
        <label className="bg-gold text-bg px-6 py-2 rounded-lg font-bold cursor-pointer hover:bg-white transition-colors relative overflow-hidden">
          <span>Select .PSD File</span>
          <input 
            type="file" 
            accept=".psd" 
            className="hidden" 
            onChange={handleUpload}
            disabled={uploading || processing}
          />
        </label>
        
        {(uploading || processing) && (
          <div className="w-full max-w-md mt-6 space-y-2">
            <div className="flex justify-between text-xs font-bold text-muted">
              <span>{processing ? 'Processing Layers...' : 'Uploading...'}</span>
              <span>{processing ? '100%' : `${progress}%`}</span>
            </div>
            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
              <div 
                className={`h-full bg-gold transition-all duration-300 ${processing ? 'w-full animate-pulse' : ''}`}
                style={{ width: processing ? '100%' : `${progress}%` }}
              />
            </div>
            {processing && (
              <p className="text-xs text-center text-muted mt-2">
                This might take a minute depending on the number of layers and resolution.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 flex justify-center">
            <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : templates.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted bg-white/5 rounded-xl border border-white/10">
            <FileCode2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No PSD templates uploaded yet.</p>
          </div>
        ) : (
          templates.map((template) => (
            <div key={template.id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden flex flex-col">
              <div className="aspect-video bg-black/50 relative group flex items-center justify-center p-4">
                {template.preview_url ? (
                  <img src={template.preview_url} alt="Template Preview" className="w-full h-full object-contain" />
                ) : (
                  <FileCode2 className="w-16 h-16 text-muted/30" />
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                  <button
                    onClick={() => navigate(`/frame-studio/${template.id}`)}
                    className="bg-gold text-bg px-6 py-2 rounded-full font-bold flex items-center gap-2 hover:scale-105 transition-transform"
                  >
                    <Play className="w-4 h-4" />
                    Open in Frame Studio
                  </button>
                </div>
              </div>
              <div className="p-4 flex flex-col gap-1">
                <h4 className="font-bold text-white truncate" title={template.source_path}>
                  {template.source_path.split('-').slice(1).join('-') || template.source_path}
                </h4>
                <div className="flex items-center justify-between text-xs text-muted">
                  <span>{new Date(template.created_at).toLocaleDateString()}</span>
                  <span>{template.canvas_width}x{template.canvas_height}px</span>
                </div>
                <div className="text-xs text-gold/80 mt-1">
                  {template.layers?.length || 0} Layers Extracted
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
