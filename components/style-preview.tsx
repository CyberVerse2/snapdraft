'use client';

import { useState, useEffect, useRef } from 'react';
import type { StyleType } from '@/app/page';
import { ArrowLeft, ArrowRight, RefreshCw, Eye } from 'lucide-react';
import Image from 'next/image';

interface StylePreviewProps {
  originalImage: string;
  selectedStyle: StyleType;
  onPreviewGenerated: (previewUrl: string) => void;
  onProceedToPayment: () => void;
  onBackToStyles: () => void;
}

const styleNames = {
  ghibli: 'GHIBLI',
  anime: 'ANIME',
  cyberpunk: 'CYBERPUNK',
  watercolor: 'WATERCOLOR',
  'art-deco': 'ART DECO',
  sketch: 'SKETCH',
  'oil-painting': 'OIL PAINT',
  'pixel-art': 'PIXEL ART',
  minecraft: 'MINECRAFT'
};

export function StylePreview({
  originalImage,
  selectedStyle,
  onPreviewGenerated,
  onProceedToPayment,
  onBackToStyles
}: StylePreviewProps) {
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [previewProgress, setPreviewProgress] = useState<number>(0);
  const [previewRequestId, setPreviewRequestId] = useState<string | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  useEffect(() => {
    generatePreview();
  }, [selectedStyle]);

  const generatePreview = async () => {
    setIsGeneratingPreview(true);
    setPreviewImage(null);
    setPreviewProgress(0);
    setPreviewRequestId(null);
    try {
      const res = await fetch('/api/generate-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: originalImage, style: selectedStyle })
      });
      if (!res.ok) throw new Error('Failed to generate preview');
      const data = await res.json();
      setPreviewRequestId(data.requestId);
      const previewUrl = data.previewImageUrl;
      setPreviewImage(previewUrl);
      onPreviewGenerated(previewUrl);
    } catch (err) {
      setPreviewImage(null);
      onPreviewGenerated('');
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  // Poll for preview progress
  useEffect(() => {
    if (previewRequestId) {
      progressIntervalRef.current = setInterval(async () => {
        const res = await fetch(`/api/generate-preview?id=${previewRequestId}`);
        const data = await res.json();
        setPreviewProgress(data.progress);
        if (data.progress >= 100) {
          if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
          setPreviewRequestId(null);
        }
      }, 1000);
      return () => {
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      };
    }
  }, [previewRequestId]);

  // Simulate progress if real progress is not available
  useEffect(() => {
    let fakeProgressInterval: NodeJS.Timeout | null = null;
    if ((isGeneratingPreview || previewRequestId) && previewProgress < 100) {
      fakeProgressInterval = setInterval(() => {
        setPreviewProgress((prev) => {
          if (prev < 95) {
            return prev + Math.max(1, Math.round((100 - prev) * 0.07));
          }
          return prev;
        });
      }, 400);
    }
    return () => {
      if (fakeProgressInterval) clearInterval(fakeProgressInterval);
    };
  }, [isGeneratingPreview, previewRequestId, previewProgress]);

  // When preview is done, jump to 100%
  useEffect(() => {
    if (!isGeneratingPreview && !previewRequestId && previewImage && previewProgress < 100) {
      setPreviewProgress(100);
    }
  }, [isGeneratingPreview, previewRequestId, previewImage]);

  const regeneratePreview = () => {
    setPreviewImage(null);
    generatePreview();
  };

  return (
    <div className="space-y-8">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToStyles}
          className="bg-gray-500 text-white px-6 py-3 border-4 border-black font-black text-lg uppercase hover:bg-gray-600 shadow-[4px_4px_0px_0px_#000000] hover:shadow-[8px_8px_0px_0px_#000000] transition-all"
        >
          <ArrowLeft className="h-5 w-5 mr-2 inline" />
          BACK
        </button>
        <div className="bg-lime-400 text-black px-6 py-3 border-4 border-black font-black text-lg uppercase">
          <Eye className="h-5 w-5 mr-2 inline" />
          FREE PREVIEW
        </div>
      </div>

      {/* Preview Section */}
      <div className="bg-white border-8 border-black shadow-[12px_12px_0px_0px_#000000]">
        <div className="bg-black text-white p-6 border-b-8 border-black text-center">
          <h3 className="text-3xl font-black uppercase">{styleNames[selectedStyle]} PREVIEW</h3>
        </div>

        <div className="p-8">
          {isGeneratingPreview || previewRequestId ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-6">
              <div className="relative">
                <div
                  className="rounded-full h-24 w-24 border-8 border-black"
                  style={{
                    background: `conic-gradient(#fde047 ${previewProgress}%, #fff 0)`
                  }}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-black text-white px-3 py-1 font-black text-sm uppercase">
                      {previewProgress}%
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-center">
                <div className="bg-yellow-400 text-black px-6 py-3 border-4 border-black font-black text-xl uppercase mb-2">
                  GENERATING PREVIEW...
                </div>
                <p className="font-bold text-lg uppercase">HOLD TIGHT!</p>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Comparison Toggle */}
              <div className="text-center">
                <button
                  onClick={() => setShowComparison(!showComparison)}
                  className="bg-blue-500 text-white px-6 py-3 border-4 border-black font-black text-lg uppercase hover:bg-blue-600 transition-colors"
                >
                  {showComparison ? 'HIDE' : 'SHOW'} COMPARISON
                </button>
              </div>

              {/* Image Display */}
              {showComparison ? (
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="text-center">
                    <div className="bg-gray-300 text-black px-4 py-2 border-4 border-black font-black text-lg uppercase mb-4">
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
                    <div className="bg-red-500 text-white px-4 py-2 border-4 border-black font-black text-lg uppercase mb-4">
                      {styleNames[selectedStyle]} PREVIEW
                    </div>
                    <div className="relative w-full aspect-square border-8 border-black shadow-[8px_8px_0px_0px_#000000] overflow-hidden">
                      <Image
                        src={previewImage || '/placeholder.svg'}
                        alt="Preview"
                        fill
                        className="object-cover cursor-zoom-in"
                        onContextMenu={(e) => e.preventDefault()}
                        onDragStart={(e) => e.preventDefault()}
                        onClick={() => previewImage && setZoomImage(previewImage)}
                      />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                        <span className="text-3xl md:text-5xl font-black uppercase text-white opacity-60 bg-black bg-opacity-40 px-6 py-2 rounded-lg">
                          SNAPDRAFT PREVIEW
                        </span>
                      </div>
                      <div className="absolute top-4 right-4 bg-yellow-400 text-black px-2 py-1 border-2 border-black font-black text-xs uppercase">
                        PREVIEW
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="max-w-lg mx-auto text-center">
                  <div className="bg-red-500 text-white px-6 py-3 border-4 border-black font-black text-xl uppercase mb-6">
                    {styleNames[selectedStyle]} PREVIEW
                  </div>
                  <div className="relative w-full aspect-square border-8 border-black shadow-[8px_8px_0px_0px_#000000] overflow-hidden">
                    <Image
                      src={previewImage || '/placeholder.svg'}
                      alt="Preview"
                      fill
                      className="object-cover"
                      onContextMenu={(e) => e.preventDefault()}
                      onDragStart={(e) => e.preventDefault()}
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                      <span className="text-3xl md:text-5xl font-black uppercase text-white opacity-60 bg-black bg-opacity-40 px-6 py-2 rounded-lg">
                        SNAPDRAFT PREVIEW
                      </span>
                    </div>
                    <div className="absolute top-4 right-4 bg-yellow-400 text-black px-3 py-2 border-2 border-black font-black text-sm uppercase">
                      PREVIEW QUALITY
                    </div>
                  </div>
                </div>
              )}

              {zoomImage && (
                <div
                  className="fixed inset-0 z-60 bg-black bg-opacity-90 flex items-center justify-center"
                  onClick={() => setZoomImage(null)}
                >
                  <img
                    src={zoomImage}
                    alt="Zoomed Preview"
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

              {/* Regenerate Button */}
              <div className="text-center">
                <button
                  onClick={regeneratePreview}
                  className="bg-purple-500 text-white px-6 py-3 border-4 border-black font-black text-lg uppercase hover:bg-purple-600 shadow-[4px_4px_0px_0px_#000000] hover:shadow-[8px_8px_0px_0px_#000000] transition-all"
                >
                  <RefreshCw className="h-5 w-5 mr-2 inline" />
                  REGENERATE
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Section */}
      {previewImage && !isGeneratingPreview && (
        <div className="bg-green-400 border-8 border-black shadow-[12px_12px_0px_0px_#000000]">
          <div className="p-8 text-center space-y-6">
            <div className="bg-black text-white px-6 py-3 border-4 border-white font-black text-2xl uppercase">
              🔥 PREVIEW READY! 🔥
            </div>

            <div className="space-y-4">
              <p className="font-black text-xl uppercase">LOVE IT? GET THE FULL QUALITY!</p>
              <div className="flex flex-wrap justify-center gap-4 text-lg font-bold uppercase">
                <span className="bg-white text-black px-4 py-2 border-4 border-black">
                  ✨ 4X RESOLUTION
                </span>
                <span className="bg-white text-black px-4 py-2 border-4 border-black">
                  🎨 ENHANCED DETAILS
                </span>
                <span className="bg-white text-black px-4 py-2 border-4 border-black">
                  💎 PREMIUM QUALITY
                </span>
              </div>
            </div>

            <div className="flex gap-4 justify-center">
              <button
                onClick={onBackToStyles}
                className="bg-gray-500 text-white px-6 py-4 border-4 border-black font-black text-lg uppercase hover:bg-gray-600 shadow-[4px_4px_0px_0px_#000000] hover:shadow-[8px_8px_0px_0px_#000000] transition-all"
              >
                TRY DIFFERENT
              </button>
              <button
                onClick={onProceedToPayment}
                className="bg-red-500 text-white px-8 py-4 border-4 border-black font-black text-xl uppercase hover:bg-red-600 shadow-[4px_4px_0px_0px_#000000] hover:shadow-[8px_8px_0px_0px_#000000] transition-all"
              >
                <ArrowRight className="h-6 w-6 mr-2 inline" />
                GET FULL QUALITY ($0.25)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
