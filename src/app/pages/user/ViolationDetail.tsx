import React, { useState } from 'react';
import { useParams, Link } from 'react-router';
import { ArrowLeft, MapPin, Calendar, Clock, Camera, Download, FileText, AlertCircle, Maximize2 } from 'lucide-react';
import { ImageViewer, ImageViewerImage } from '@/app/components/ImageViewer';
import { format } from 'date-fns';

export function ViolationDetail() {
  const { id } = useParams();
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Evidence images for this violation
  const evidenceImages: ImageViewerImage[] = [
    {
      src: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=1200',
      alt: 'Violation evidence',
      caption: 'No Helmet violation captured',
      metadata: {
        timestamp: '2024-02-20 14:32:05',
        camera: 'Gate 1 Cam',
        confidence: 94
      }
    },
    {
      src: 'https://images.unsplash.com/photo-1609630875171-b1321377ee65?auto=format&fit=crop&q=80&w=1200',
      alt: 'License plate',
      caption: 'License plate ABC-1234',
      metadata: {
        timestamp: '2024-02-20 14:32:06',
        camera: 'Gate 1 Cam',
        confidence: 98
      }
    }
  ];

  const handleOpenImageViewer = (index: number) => {
    setSelectedImageIndex(index);
    setShowImageViewer(true);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/user/violations" className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Violation {id || 'VIO-2024-001'}</h1>
            <p className="text-slate-400 text-sm mt-1">View violation details and evidence</p>
          </div>
        </div>
        
        <span className="px-3 py-1.5 rounded-full text-sm font-medium bg-red-500/10 text-red-400 border border-red-500/20">
          Unpaid
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Evidence Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Evidence Gallery */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Camera className="w-4 h-4 text-blue-400" />
                Violation Evidence
              </h3>
              <button
                onClick={() => handleOpenImageViewer(0)}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
              >
                <Maximize2 className="w-4 h-4" />
                View Gallery
              </button>
            </div>
            
            <div 
              className="relative aspect-video bg-black group cursor-pointer"
              onClick={() => handleOpenImageViewer(0)}
            >
              <img 
                src={evidenceImages[0].src}
                alt={evidenceImages[0].alt}
                className="w-full h-full object-cover"
              />
              
              {/* Zoom Overlay Hint */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium">
                  <Maximize2 className="w-4 h-4" />
                  Click to zoom and view details
                </div>
              </div>

              <div className="absolute bottom-4 right-4 bg-black/70 px-3 py-1.5 rounded text-white text-xs font-mono">
                2024-02-20 14:32:05
              </div>
            </div>

            <div className="p-4 bg-slate-950 grid grid-cols-2 gap-2">
              {evidenceImages.map((img, i) => (
                <button 
                  key={i} 
                  onClick={() => handleOpenImageViewer(i)}
                  className={`aspect-video bg-slate-800 rounded overflow-hidden border-2 transition-all ${
                    i === 0 ? 'border-blue-500 ring-2 ring-blue-500/50' : 'border-transparent hover:border-slate-600'
                  }`}
                >
                  <img 
                    src={img.src} 
                    alt={img.alt}
                    className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Violation Information */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
            <h3 className="font-semibold text-white mb-4">Violation Information</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Violation Type</span>
                <span className="text-orange-400 font-medium">No Helmet</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Date & Time</span>
                <span className="text-slate-200">Feb 20, 2024 at 14:32:05</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Location</span>
                <span className="text-slate-200">Gate 1 Cam</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Plate Number</span>
                <div className="bg-white text-black font-bold px-2 py-0.5 rounded text-sm font-mono border-2 border-black">
                  ABC-1234
                </div>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-400">Detection Confidence</span>
                <span className="text-slate-200 font-mono">94%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions Column */}
        <div className="space-y-6">
          {/* Payment Information */}
          <div className="bg-red-900/10 rounded-xl border border-red-500/20 p-6">
            <h3 className="font-semibold text-red-400 mb-4 text-sm uppercase tracking-wider">Payment Due</h3>
            <div className="mb-4">
              <div className="text-3xl font-bold text-white mb-1">₱1,000.00</div>
              <div className="text-sm text-slate-400">Due: March 20, 2024</div>
            </div>
            
            <Link 
              to={`/user/violations/${id}/payment`}
              className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center px-4 py-3 rounded-lg font-medium transition-colors"
            >
              Pay Now
            </Link>
            
            <div className="mt-3 pt-3 border-t border-red-500/20">
              <p className="text-xs text-slate-500 text-center">
                Late payment may result in additional penalties
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
            <h3 className="font-semibold text-white mb-4">Actions</h3>
            <div className="space-y-2">
              <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors text-sm">
                <FileText className="w-4 h-4" />
                File an Appeal
              </button>
              <button 
                onClick={() => handleOpenImageViewer(0)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors text-sm"
              >
                <Download className="w-4 h-4" />
                Download Evidence
              </button>
            </div>
          </div>

          {/* Legal Reference */}
          <div className="bg-blue-900/10 rounded-xl border border-blue-500/20 p-6">
            <h3 className="font-semibold text-blue-400 mb-2 text-sm uppercase tracking-wider">Legal Reference</h3>
            <p className="text-base font-bold text-white mb-1">Republic Act No. 10054</p>
            <p className="text-sm text-slate-400">Motorcycle Helmet Act of 2009</p>
          </div>
        </div>
      </div>

      {/* Image Viewer */}
      {showImageViewer && (
        <ImageViewer
          open={showImageViewer}
          onClose={() => setShowImageViewer(false)}
          images={evidenceImages}
          initialIndex={selectedImageIndex}
        />
      )}
    </div>
  );
}