import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import FrameStudio from './FrameStudio';
import { ArrowLeft } from 'lucide-react';

export default function FrameStudioPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#09090b] text-white p-6">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-muted hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Back
      </button>
      <div className="max-w-6xl mx-auto">
        <FrameStudio templateId={id} />
      </div>
    </div>
  );
}
