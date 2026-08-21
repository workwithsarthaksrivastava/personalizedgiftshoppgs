import React, { useEffect, useRef, useState } from 'react';
import { Canvas, Textbox, FabricImage } from 'fabric';
import { supabase } from '../supabase';
import { toast } from 'sonner';

export default function FrameStudio({ templateId }: { templateId?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<Canvas | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (canvasRef.current && !fabricCanvas) {
      const canvas = new Canvas(canvasRef.current, {
        width: 800,
        height: 600,
        backgroundColor: '#f3f4f6'
      });
      setFabricCanvas(canvas);
      
      return () => {
        canvas.dispose();
      };
    }
  }, [canvasRef, fabricCanvas]);

  useEffect(() => {
    if (templateId && fabricCanvas) {
      loadPSDIntoFrameStudio(templateId);
    }
  }, [templateId, fabricCanvas]);

  const loadPSDIntoFrameStudio = async (id: string) => {
    if (!fabricCanvas) return;
    setLoading(true);
    
    try {
      // 1. Fetch template row from psd_templates
      const { data: template, error } = await supabase
        .from('psd_templates')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error || !template) {
        toast.error('Failed to load PSD template');
        setLoading(false);
        return;
      }
      
      // 2. Resize Fabric.js canvas to match
      const maxWidth = 800; // fit into container roughly
      const scale = maxWidth / template.canvas_width;
      
      fabricCanvas.setDimensions({
        width: maxWidth,
        height: template.canvas_height * scale
      });
      
      // Clear existing
      fabricCanvas.clear();
      fabricCanvas.backgroundColor = '#ffffff';

      // 3. Loop through layers and add as native Fabric.js objects
      for (const layer of (template.layers || [])) {
        if (layer.type === 'text') {
          const textObj = new Textbox(layer.text, {
            left: layer.left * scale,
            top: layer.top * scale,
            width: layer.width * scale,
            fontSize: layer.fontSize * scale,
            fontFamily: layer.font,
            opacity: layer.opacity,
            editable: true
          });
          fabricCanvas.add(textObj);
        } else if (layer.type === 'image' && layer.url) {
          try {
            const imgElement = new Image();
            imgElement.crossOrigin = 'anonymous';
            imgElement.src = layer.url;
            await new Promise((resolve, reject) => {
              imgElement.onload = () => resolve(null);
              imgElement.onerror = reject;
            });
            const img = new FabricImage(imgElement, {
               left: layer.left * scale,
               top: layer.top * scale,
               scaleX: (layer.width / imgElement.width) * scale,
               scaleY: (layer.height / imgElement.height) * scale,
               opacity: layer.opacity
            });
            fabricCanvas.add(img);
            fabricCanvas.renderAll();
          } catch (e) {
            console.error("Failed to load image layer", e);
          }
        }
      }
      
      fabricCanvas.renderAll();
      toast.success('PSD loaded into Frame Studio!');
    } catch (err: any) {
      console.error(err);
      toast.error('Error loading PSD');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div className="flex w-full justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Frame Studio Editor</h2>
        {loading && <span className="text-sm text-gray-500 animate-pulse">Loading PSD Data...</span>}
      </div>
      <div className="border border-gray-300 shadow-sm rounded bg-gray-50 overflow-hidden flex items-center justify-center p-4">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}
