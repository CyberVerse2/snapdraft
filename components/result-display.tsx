'use client';

import { useEffect, useState } from 'react';
import type { StyleType } from '@/app/page';
import { Download, Twitter, RefreshCw, Share2, PlusCircle } from 'lucide-react';
import Image from 'next/image';

interface ResultDisplayProps {
  originalImage: string;
  styledImage: string;
  selectedStyle: StyleType;
  onReset: () => void;
  isLoading?: boolean;
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
  isLoading
}: ResultDisplayProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const styleLabel = showOriginal
    ? 'ORIGINAL'
    : styleNames[selectedStyle] || selectedStyle?.toUpperCase() || 'STYLE';
  const imageToShow = showOriginal ? originalImage : styledImage;

  // Simulated loading progress similar to StylePreview
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isLoading) {
      setProgress(0);
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev < 95) {
            return prev + Math.max(1, Math.round((100 - prev) * 0.07));
          }
          return prev;
        });
      }, 400);
    } else {
      setProgress(100);
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLoading]);

  // When a new styled image arrives, ensure we display it (not the placeholder or original)
  useEffect(() => {
    if (styledImage) {
      setShowOriginal(false);
    }
  }, [styledImage]);

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
      <div className="w-full max-w-md mx-auto bg-green-400 text-black px-6 py-3 border-4 border-black font-black text-xl uppercase text-center mt-2 mb-2 rounded-lg">
        GENERATION COMPLETE
      </div>
      {/* Generated Image (toggle on click) with loader from preview */}
      <div
        className="relative w-full max-w-md mx-auto h-80 border-8 border-black shadow-[8px_8px_0px_0px_#000000] mb-4 cursor-pointer overflow-hidden"
        onClick={() => setShowOriginal((v) => !v)}
      >
        <Image
          key={imageToShow || 'placeholder'}
          src={imageToShow || '/placeholder.svg'}
          alt={showOriginal ? 'Original Image' : 'Styled Result'}
          width={320}
          height={400}
          className="object-cover w-full h-full"
        />
        {isLoading && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center space-y-6">
            <div className="relative">
              <div
                className="rounded-full h-24 w-24 border-8 border-black"
                style={{ background: `conic-gradient(#fde047 ${progress}%, #fff 0)` }}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-black text-white px-3 py-1 font-black text-sm uppercase">
                    {progress}%
                  </div>
                </div>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-yellow-400 text-black px-6 py-3 border-4 border-black font-black text-xl uppercase mb-2">
                GENERATING...
              </div>
              <p className="font-bold text-lg uppercase text-white">HOLD TIGHT!</p>
            </div>
          </div>
        )}
      </div>
      {/* Style Badge */}
      <div className="bg-yellow-400 text-black px-6 py-1 border-4 border-black font-black text-xl uppercase rounded-lg mb-4">
        {styleLabel}
      </div>
      {/* Action Buttons: Download, Share, Generate Another */}
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
          onClick={onReset}
          className="flex-[0.7] bg-yellow-400 text-black py-4 border-4 border-black font-black text-lg uppercase rounded-xl hover:bg-yellow-300 shadow-[2px_2px_0px_0px_#000000] transition-all"
          aria-label="Generate Another"
        >
          <PlusCircle className="inline-block" />
        </button>
      </div>
      {/* Removed fourth button */}
    </div>
  );
}
