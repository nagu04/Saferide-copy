import React, { useState, useEffect, useCallback } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Download, 
  ChevronLeft, 
  ChevronRight,
  Maximize2,
  Columns2,
  Grid3x3
} from 'lucide-react';

export interface ImageViewerImage {
  src: string;
  alt: string;
  caption?: string;
  metadata?: {
    timestamp?: string;
    camera?: string;
    confidence?: number;
  };
}

interface ImageViewerProps {
  images: ImageViewerImage[];
  initialIndex?: number;
  onClose: () => void;
  open: boolean;
}

export function ImageViewer({ images, initialIndex = 0, onClose, open }: ImageViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [viewMode, setViewMode] = useState<'single' | 'compare' | 'grid'>('single');
  const [compareIndex, setCompareIndex] = useState<number>(Math.min(1, images.length - 1));

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrevious();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, currentIndex, images.length]);

  const handlePrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  }, [images.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  }, [images.length]);

  const handleDownload = async (index: number) => {
    const image = images[index];
    try {
      const response = await fetch(image.src);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `violation-evidence-${index + 1}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/50 backdrop-blur-sm border-b border-slate-700">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-white">
            Evidence Gallery ({currentIndex + 1} / {images.length})
          </h3>
          {images[currentIndex].metadata && (
            <div className="flex gap-4 text-sm text-slate-400">
              {images[currentIndex].metadata.camera && (
                <span>Camera: {images[currentIndex].metadata.camera}</span>
              )}
              {images[currentIndex].metadata.timestamp && (
                <span>{images[currentIndex].metadata.timestamp}</span>
              )}
              {images[currentIndex].metadata.confidence && (
                <span>Confidence: {images[currentIndex].metadata.confidence}%</span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex bg-slate-900 rounded-lg p-1 gap-1">
            <button
              onClick={() => setViewMode('single')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'single' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Single View"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('compare')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'compare' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Compare View"
              disabled={images.length < 2}
            >
              <Columns2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Grid View"
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'single' && (
          <ZoomableImage 
            image={images[currentIndex]} 
            onDownload={() => handleDownload(currentIndex)}
          />
        )}

        {viewMode === 'compare' && (
          <div className="h-full grid grid-cols-2 gap-2 p-4">
            <div className="relative">
              <ZoomableImage 
                image={images[currentIndex]} 
                onDownload={() => handleDownload(currentIndex)}
                showLabel="Image A"
              />
            </div>
            <div className="relative">
              <div className="absolute top-4 left-4 z-10">
                <select
                  value={compareIndex}
                  onChange={(e) => setCompareIndex(parseInt(e.target.value))}
                  className="bg-slate-900 text-white rounded-lg px-3 py-2 text-sm border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {images.map((img, idx) => (
                    <option key={idx} value={idx} disabled={idx === currentIndex}>
                      Image {idx + 1}
                    </option>
                  ))}
                </select>
              </div>
              <ZoomableImage 
                image={images[compareIndex]} 
                onDownload={() => handleDownload(compareIndex)}
                showLabel="Image B"
              />
            </div>
          </div>
        )}

        {viewMode === 'grid' && (
          <div className="h-full overflow-auto p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-7xl mx-auto">
              {images.map((image, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setCurrentIndex(idx);
                    setViewMode('single');
                  }}
                  className={`relative aspect-video bg-slate-900 rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                    idx === currentIndex 
                      ? 'border-blue-500 ring-2 ring-blue-500/50' 
                      : 'border-slate-700 hover:border-slate-500'
                  }`}
                >
                  <img
                    src={image.src}
                    alt={image.alt}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-2 left-2 right-2">
                    <p className="text-white text-sm font-medium truncate">
                      Image {idx + 1}
                    </p>
                    {image.caption && (
                      <p className="text-slate-300 text-xs truncate">{image.caption}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Controls (only in single/compare mode) */}
      {viewMode !== 'grid' && images.length > 1 && (
        <>
          <button
            onClick={handlePrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-sm transition-colors"
            title="Previous (←)"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-sm transition-colors"
            title="Next (→)"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Thumbnail Strip */}
      {viewMode !== 'grid' && images.length > 1 && (
        <div className="bg-black/50 backdrop-blur-sm border-t border-slate-700 p-4">
          <div className="flex gap-2 overflow-x-auto max-w-full">
            {images.map((image, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`relative flex-shrink-0 w-24 h-16 rounded overflow-hidden border-2 transition-all ${
                  idx === currentIndex 
                    ? 'border-blue-500 ring-2 ring-blue-500/50' 
                    : 'border-slate-600 hover:border-slate-400'
                }`}
              >
                <img
                  src={image.src}
                  alt={image.alt}
                  className="w-full h-full object-cover"
                />
                {viewMode === 'compare' && idx === compareIndex && (
                  <div className="absolute inset-0 bg-green-500/20 border-2 border-green-500">
                    <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] px-1 font-bold">
                      B
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface ZoomableImageProps {
  image: ImageViewerImage;
  onDownload: () => void;
  showLabel?: string;
}

function ZoomableImage({ image, onDownload, showLabel }: ZoomableImageProps) {
  return (
    <div className="relative w-full h-full">
      {showLabel && (
        <div className="absolute top-4 left-4 z-10 bg-slate-900/90 text-white px-3 py-1.5 rounded-lg text-sm font-medium border border-slate-700">
          {showLabel}
        </div>
      )}
      
      <TransformWrapper
        initialScale={1}
        minScale={0.5}
        maxScale={5}
        centerOnInit
        wheel={{ step: 0.1 }}
        doubleClick={{ mode: 'reset' }}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            {/* Zoom Controls */}
            <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
              <button
                onClick={() => zoomIn()}
                className="p-2 bg-slate-900/90 hover:bg-slate-800 text-white rounded-lg transition-colors border border-slate-700"
                title="Zoom In"
              >
                <ZoomIn className="w-5 h-5" />
              </button>
              <button
                onClick={() => zoomOut()}
                className="p-2 bg-slate-900/90 hover:bg-slate-800 text-white rounded-lg transition-colors border border-slate-700"
                title="Zoom Out"
              >
                <ZoomOut className="w-5 h-5" />
              </button>
              <button
                onClick={() => resetTransform()}
                className="p-2 bg-slate-900/90 hover:bg-slate-800 text-white rounded-lg transition-colors border border-slate-700"
                title="Reset Zoom"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
              <button
                onClick={onDownload}
                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                title="Download Original"
              >
                <Download className="w-5 h-5" />
              </button>
            </div>

            <TransformComponent
              wrapperClass="!w-full !h-full"
              contentClass="!w-full !h-full flex items-center justify-center"
            >
              <img
                src={image.src}
                alt={image.alt}
                className="max-w-full max-h-full object-contain"
                draggable={false}
              />
            </TransformComponent>

            {/* Image Caption */}
            {image.caption && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-black/70 text-white px-4 py-2 rounded-lg text-sm max-w-2xl text-center backdrop-blur-sm">
                {image.caption}
              </div>
            )}
          </>
        )}
      </TransformWrapper>
    </div>
  );
}
