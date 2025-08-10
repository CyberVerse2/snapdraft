'use client';

import { useEffect, useState } from 'react';
import type { StyleType } from '@/app/page';
import { Download, Twitter, RefreshCw, Share2 } from 'lucide-react';
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
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const styleLabel = showOriginal
    ? 'ORIGINAL'
    : styleNames[selectedStyle] || selectedStyle?.toUpperCase() || 'STYLE';
  const imageToShow = showOriginal ? originalImage : styledImage;

  // Simulated loading progress similar to StylePreview (slower ramp-up)
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isLoading) {
      setProgress(0);
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev < 95) {
            // slower progression for a more gradual fill
            return prev + Math.max(1, Math.round((100 - prev) * 0.03));
          }
          return prev;
        });
      }, 500);
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

  const showOverlay = Boolean(isLoading);

  const handleDownload = () => {
    setShowDownloadModal(true);
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
      <div className="w-full max-w-md mx-auto bg-green-400 text-black px-3 py-1 border-4 border-black font-black text-xl uppercase text-center mt-3 mb-3 rounded-lg">
        GENERATION COMPLETE
      </div>
      {/* Generated Image (toggle on click) with loader from preview */}
      <div
        className="relative w-full max-w-md mx-auto h-64 sm:h-80 border-8 border-black shadow-[8px_8px_0px_0px_#000000] mb-4 cursor-pointer overflow-hidden"
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
        {showOverlay && (
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
      <div className="bg-yellow-400 text-black px-6 py-1 border-4 border-black font-black text-xl uppercase rounded-lg mb-2">
        {styleLabel}
      </div>
      {/* Action Buttons: Download, Share, Generate Another */}
      <div className="flex flex-row gap-2 w-full mt-2 items-center">
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
          <RefreshCw className="inline-block" />
        </button>
      </div>
      {/* Removed fourth button */}
      {showDownloadModal && (
        <div
          className="fixed inset-0 z-[90] bg-black/70 flex items-center justify-center px-4"
          onClick={() => setShowDownloadModal(false)}
        >
          <div
            className="bg-white border-8 border-black rounded-xl max-w-md w-full p-6 flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-black uppercase text-center">Copy Image Link</h3>
            <div className="bg-gray-100 border-2 border-black rounded-lg px-3 py-2 font-mono text-xs break-all select-all">
              {styledImage}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(styledImage).catch(() => {});
                }}
                className="flex-1 bg-yellow-400 text-black px-4 py-2 border-4 border-black font-black uppercase rounded-lg hover:bg-yellow-300"
              >
                Copy
              </button>
              <a
                href={styledImage}
                target="_blank"
                rel="noreferrer"
                className="flex-1 text-center bg-blue-500 text-white px-4 py-2 border-4 border-black font-black uppercase rounded-lg hover:bg-blue-600"
              >
                Open
              </a>
            </div>
            <button
              onClick={() => setShowDownloadModal(false)}
              className="bg-red-500 text-white px-4 py-2 border-4 border-black font-black uppercase rounded-lg hover:bg-red-600"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
