'use client';

import { useState } from 'react';
import type { StyleType } from '@/app/page';
import { Download, Twitter, RefreshCw, Share2, X } from 'lucide-react';
import Image from 'next/image';

interface ResultDisplayProps {
  originalImage: string;
  styledImage: string;
  selectedStyle: StyleType;
  onReset: () => void;
}

const styleNames = {
  ghibli: 'GHIBLI',
  anime: 'ANIME',
  cyberpunk: 'CYBERPUNK',
  watercolor: 'WATERCOLOR',
  neobrutalism: 'BRUTAL',
  'material-design': 'MATERIAL',
  minimalist: 'MINIMAL',
  'art-deco': 'ART DECO',
  vaporwave: 'VAPORWAVE',
  sketch: 'SKETCH',
  'oil-painting': 'OIL PAINT',
  'pixel-art': 'PIXEL ART',
  minecraft: 'MINECRAFT'
};

export function ResultDisplay({
  originalImage,
  styledImage,
  selectedStyle,
  onReset
}: ResultDisplayProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(styledImage);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `styled-image-${selectedStyle}-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
    setIsDownloading(false);
  };

  const handleTwitterShare = () => {
    const text = `Check out my AI-styled image created with SNAPDRAFT AI!\n\n${styledImage}`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My AI Styled Image',
          text: 'Check out this amazing AI-styled image!',
          url: window.location.href
        });
      } catch (error) {
        console.error('Share failed:', error);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <div className="space-y-8">
      {/* Success Header */}
      <div className="text-center">
        <div className="bg-green-400 text-black px-8 py-4 border-4 border-black font-black text-3xl uppercase inline-block shadow-[8px_8px_0px_0px_#000000] scale-75">
          ✨ GENERATION COMPLETE! ✨
        </div>
        
      </div>

      {/* Image Comparison */}
      <div className="grid md:grid-cols-2 gap-8">
        <div className="text-center">
          <div className="bg-gray-400 text-black px-4 py-3 border-4 border-black font-black text-xl uppercase mb-4">
            ORIGINAL
          </div>
          <div className="relative w-full aspect-square border-8 border-black shadow-[8px_8px_0px_0px_#000000]">
            <Image
              src={originalImage || '/placeholder.svg'}
              alt="Original"
              fill
              className="object-cover"
            />
          </div>
        </div>

        <div className="text-center">
          <div className="bg-red-500 text-white px-4 py-3 border-4 border-black font-black text-xl uppercase mb-4">
            {styleNames[selectedStyle] || selectedStyle?.toUpperCase() || 'STYLE'}
          </div>
          <div className="relative w-full aspect-square border-8 border-black shadow-[8px_8px_0px_0px_#000000]">
            <Image
              src={styledImage || '/placeholder.svg'}
              alt="Styled"
              fill
              className="object-cover cursor-zoom-in"
              onContextMenu={(e) => e.preventDefault()}
              onDragStart={(e) => e.preventDefault()}
              onClick={() => styledImage && setZoomImage(styledImage)}
            />
            <div className="absolute top-4 right-4 bg-yellow-400 text-black px-3 py-2 border-2 border-black font-black text-sm uppercase">
              HIGH QUALITY
            </div>
          </div>
        </div>
      </div>

      {zoomImage && (
        <div
          className="fixed inset-0 z-60 bg-black bg-opacity-90 flex items-center justify-center"
          onClick={() => setZoomImage(null)}
        >
          <img
            src={zoomImage}
            alt="Zoomed Result"
            className="max-w-full max-h-full rounded-lg shadow-lg cursor-zoom-out"
            style={{ touchAction: 'pan-x pan-y pinch-zoom' }}
            draggable={false}
            onContextMenu={(e) => e.preventDefault()}
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setZoomImage(null)}
            className="absolute top-4 right-4 bg-red-500 text-white px-4 py-2 border-4 border-black font-black text-lg uppercase hover:bg-red-600 rounded-lg"
          >
            CLOSE
          </button>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 justify-center">
        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className="bg-green-500 text-white px-8 py-4 border-4 border-black font-black text-lg uppercase hover:bg-green-600 shadow-[4px_4px_0px_0px_#000000] hover:shadow-[8px_8px_0px_0px_#000000] transition-all disabled:opacity-50"
        >
          {isDownloading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2 inline-block"></div>
          ) : (
            <Download className="w-5 h-5 mr-2 inline" />
          )}
          DOWNLOAD
        </button>

        <button
          onClick={handleTwitterShare}
          className="bg-blue-500 text-white px-8 py-4 border-4 border-black font-black text-lg uppercase hover:bg-blue-600 shadow-[4px_4px_0px_0px_#000000] hover:shadow-[8px_8px_0px_0px_#000000] transition-all"
        >
          <X className="w-5 h-5 mr-2 inline" />
          TWITTER
        </button>

        <button
          onClick={onReset}
          className="bg-gray-500 text-white px-8 py-4 border-4 border-black font-black text-lg uppercase hover:bg-gray-600 shadow-[4px_4px_0px_0px_#000000] hover:shadow-[8px_8px_0px_0px_#000000] transition-all"
        >
          <RefreshCw className="w-5 h-5 mr-2 inline" />
          CREATE ANOTHER
        </button>
      </div>
    </div>
  );
}
