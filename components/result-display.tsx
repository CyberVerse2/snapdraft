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
  isFavorite: boolean;
  onFavorite: () => void;
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
  onReset,
  isFavorite,
  onFavorite
}: ResultDisplayProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const styleLabel = showOriginal
    ? 'ORIGINAL'
    : styleNames[selectedStyle] || selectedStyle?.toUpperCase() || 'STYLE';
  const imageToShow = showOriginal ? originalImage : styledImage;

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
    <div className="flex flex-col items-center w-full max-w-md mx-auto px-4">
      {/* Generation Complete Banner */}
      <div className="w-full max-w-md mx-auto bg-green-400 text-black px-8 py-4 border-4 border-black font-black text-xl uppercase text-center mt-4 mb-6 rounded-lg">
        GENERATION COMPLETE
      </div>
      {/* Generated Image (toggle on click) */}
      <div
        className="w-full max-w-md mx-auto h-80 border-8 border-black shadow-[8px_8px_0px_0px_#000000] mb-4 cursor-pointer overflow-hidden"
        onClick={() => setShowOriginal((v) => !v)}
      >
        <Image
          src={imageToShow || '/placeholder.svg'}
          alt={showOriginal ? 'Original Image' : 'Styled Result'}
          width={320}
          height={400}
          className="object-cover w-full h-full"
        />
      </div>
      {/* Style Badge */}
      <div className="bg-yellow-400 text-black px-6 py-1 border-4 border-black font-black text-xl uppercase rounded-lg mb-4">
        {styleLabel}
      </div>
      {/* Action Buttons: Download, Share, Favorite in one row */}
      <div className="flex flex-row gap-2 w-full mt-6 items-center">
        <button
          onClick={handleDownload}
          className="flex-[2] bg-green-500 text-white py-4 border-4 border-black font-black text-lg uppercase rounded-xl hover:bg-green-600 shadow-[4px_4px_0px_0px_#000000] transition-all"
        >
          Download
        </button>
        <button
          onClick={handleTwitterShare}
          className="flex-1 bg-blue-500 text-white py-4 border-4 border-black font-black text-lg uppercase rounded-xl hover:bg-blue-600 shadow-[4px_4px_0px_0px_#000000] transition-all"
        >
          Share
        </button>
        <button
          onClick={onFavorite}
          className={`flex-[0.7] py-4 text-lg ${
            isFavorite ? 'text-yellow-400' : 'text-gray-400'
          } bg-white border-4 border-black rounded-xl shadow-[2px_2px_0px_0px_#000000] transition-all hover:bg-yellow-100`}
          aria-label={isFavorite ? 'Unfavorite' : 'Favorite'}
        >
          ★
        </button>
      </div>
      {/* Try Another Button */}
      <button
        onClick={onReset}
        className="w-full bg-black text-white py-4 border-4 border-black font-black text-xl uppercase rounded-xl mt-8 mb-24 hover:bg-gray-900 shadow-[4px_4px_0px_0px_#000000] transition-all"
      >
        Try Another
      </button>
    </div>
  );
}
