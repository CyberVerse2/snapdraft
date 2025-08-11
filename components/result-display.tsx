'use client';

import { useEffect, useState } from 'react';
import type { StyleType } from '@/app/page';
import { Download, Twitter, RefreshCw, Share2, Home } from 'lucide-react';
import { useMiniKit } from '@coinbase/onchainkit/minikit';
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
  const [showOriginal, setShowOriginal] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const sdk = useMiniKit();
  const styleLabel = showOriginal
    ? 'ORIGINAL'
    : styleNames[selectedStyle] || selectedStyle?.toUpperCase() || 'STYLE';
  const imageToShow = showOriginal ? originalImage : styledImage;
  const safeImageToShow = imageToShow || '/placeholder.svg';

  // When a new styled image arrives, ensure we display it (not the placeholder or original)
  useEffect(() => {
    if (styledImage) {
      setShowOriginal(false);
    }
  }, [styledImage]);

  // No loading overlay here; handled in StylePreview

  const handleDownload = () => {
    // Debug: trace modal open
    console.log('[ResultDisplay] Open download modal');
    setCopiedUrl(false);
    setShowDownloadModal(true);
  };

  const handleTwitterShare = () => {
    const text = `Check out my AI-styled image created with SNAPDRAFT AI!\n\n${styledImage}`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleShareToFarcaster = () => {
    const APP_URL =
      process.env.NEXT_PUBLIC_URL || (typeof window !== 'undefined' ? window.location.origin : '');
    const shareText = 'Just styled an image with SNAPDRAFT AI!';
    const shareEmbed = `${APP_URL}/share/${encodeURIComponent(styledImage)}`;
    if (sdk && (sdk as any).actions && typeof (sdk as any).actions.composeCast === 'function') {
      (sdk as any).actions.composeCast({ text: shareText, embeds: [shareEmbed] });
    } else if (navigator.share) {
      navigator.share({ title: 'SNAPDRAFT AI', text: shareText, url: shareEmbed }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareEmbed).catch(() => {});
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto px-4">
      {/* Generation Complete Banner */}
      <div className="w-full max-w-md mx-auto bg-green-400 text-black px-3 py-1 border-4 border-black font-black text-xl uppercase text-center mt-3 mb-4 rounded-lg">
        GENERATION COMPLETE
      </div>
      {/* Generated Image (toggle on click) with loader from preview */}
      <div
        className="relative w-full max-w-md mx-auto h-64 sm:h-80 border-8 border-black shadow-[8px_8px_0px_0px_#000000] mb-4 cursor-pointer overflow-hidden"
        onClick={() => setShowOriginal((v) => !v)}
      >
        <img
          key={safeImageToShow}
          src={safeImageToShow}
          alt={showOriginal ? 'Original Image' : 'Styled Result'}
          className="object-cover w-full h-full"
        />
        {/* No overlay */}
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
          onClick={handleShareToFarcaster}
          className="flex-1 bg-white text-black py-4 border-4 border-black font-black text-lg uppercase rounded-xl hover:bg-gray-100 shadow-[4px_4px_0px_0px_#000000] transition-all"
          aria-label="Share to Farcaster"
          title="Share to Farcaster"
        >
          <img src="/white-purple.svg" alt="Farcaster" className="inline-block w-8" />
        </button>
        <button
          onClick={onReset}
          className="flex-[0.7] bg-yellow-400 text-black py-4 border-4 border-black font-black text-lg uppercase rounded-xl hover:bg-yellow-300 shadow-[2px_2px_0px_0px_#000000] transition-all"
          aria-label="Back to Home"
          title="Back to Home"
        >
          <Home className="inline-block" />
        </button>
      </div>
      {/* Removed fourth button */}
      {showDownloadModal && (
        <div
          className="fixed inset-0 z-[999] bg-black/70 flex items-center justify-center px-4"
          onClick={() => {
            setShowDownloadModal(false);
            setCopiedUrl(false);
          }}
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
                  navigator.clipboard
                    .writeText(styledImage)
                    .then(() => {
                      setCopiedUrl(true);
                      setTimeout(() => setCopiedUrl(false), 1500);
                    })
                    .catch(() => {});
                }}
                className="flex-1 bg-yellow-400 text-black px-4 py-2 border-4 border-black font-black uppercase rounded-lg hover:bg-yellow-300"
              >
                {copiedUrl ? 'Copied!' : 'Copy'}
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
              onClick={() => {
                setShowDownloadModal(false);
                setCopiedUrl(false);
              }}
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
