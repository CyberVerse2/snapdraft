'use client';

import { pay, getPaymentStatus } from '@base-org/account';
import { useState, useEffect } from 'react';
import { ImageUpload } from '@/components/image-upload';
import { StyleSelection } from '@/components/style-selection';
import { PaymentForm } from '@/components/payment-form';
import { ResultDisplay } from '@/components/result-display';
import { StylePreview } from '@/components/style-preview';

export type StyleType =
  | 'ghibli'
  | 'anime'
  | 'cyberpunk'
  | 'watercolor'
  | 'sketch'
  | 'oil-painting'
  | 'pixel-art';

export interface AppState {
  step: 'upload' | 'style' | 'preview' | 'payment' | 'result';
  originalImage: string | null;
  selectedStyle: StyleType | null;
  previewImage: string | null;
  styledImage: string | null;
  paymentCompleted: boolean;
}

export interface GalleryEntry {
  url: string;
  style: StyleType | null;
  ts: number;
}

function getGallery(): GalleryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem('snapdraft_gallery') || '[]');
  } catch {
    return [];
  }
}
function saveToGallery(entry: GalleryEntry) {
  if (typeof window === 'undefined') return;
  const gallery = getGallery();
  gallery.unshift(entry);
  localStorage.setItem('snapdraft_gallery', JSON.stringify(gallery.slice(0, 50)));
}

export default function Home() {
  const [state, setState] = useState<AppState>({
    step: 'upload',
    originalImage: null,
    selectedStyle: null,
    previewImage: null,
    styledImage: null,
    paymentCompleted: false
  });
  const [showGallery, setShowGallery] = useState(false);
  const [gallery, setGallery] = useState<GalleryEntry[]>([]);
  const [selectedGalleryIndex, setSelectedGalleryIndex] = useState<number | null>(null);
  const [favorites, setFavorites] = useState<{ [key: number]: boolean }>(() => {
    if (typeof window === 'undefined') return {};
    try {
      return JSON.parse(localStorage.getItem('snapdraft_favorites') || '{}');
    } catch {
      return {};
    }
  });
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  useEffect(() => {
    if (showGallery) setGallery(getGallery());
  }, [showGallery]);

  const handleImageUpload = (imageUrl: string) => {
    setState((prev) => ({
      ...prev,
      originalImage: imageUrl,
      step: 'style'
    }));
  };

  const handleStyleSelect = (style: StyleType) => {
    setState((prev) => ({
      ...prev,
      selectedStyle: style,
      step: 'preview'
    }));
  };

  const handlePreviewGenerated = (previewUrl: string) => {
    setState((prev) => ({
      ...prev,
      previewImage: previewUrl
    }));
  };

  const handleProceedToPayment = () => {
    setState((prev) => ({
      ...prev,
      step: 'payment'
    }));
  };

  const handlePaymentSuccess = () => {
    setState((prev) => ({
      ...prev,
      paymentCompleted: true,
      step: 'result'
    }));
  };

  const handleStyledImageGenerated = (imageUrl: string) => {
    setState((prev) => ({
      ...prev,
      styledImage: imageUrl
    }));
    // Save to gallery
    saveToGallery({
      url: imageUrl,
      style: state.selectedStyle,
      ts: Date.now()
    });
  };

  const resetApp = () => {
    setState({
      step: 'upload',
      originalImage: null,
      selectedStyle: null,
      previewImage: null,
      styledImage: null,
      paymentCompleted: false
    });
  };

  const setStep = (newStep: AppState['step']) => {
    const currentStepIndex = ['upload', 'style', 'preview', 'payment', 'result'].indexOf(
      state.step
    );
    const newStepIndex = ['upload', 'style', 'preview', 'payment', 'result'].indexOf(newStep);

    // Allow navigation only to previous steps or the current step
    if (newStepIndex <= currentStepIndex) {
      setState((prev) => ({ ...prev, step: newStep }));
    }
  };

  function toggleFavorite(ts: number) {
    const newFavs = { ...favorites, [ts]: !favorites[ts] };
    setFavorites(newFavs);
    localStorage.setItem('snapdraft_favorites', JSON.stringify(newFavs));
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Gallery Modal */}
      {showGallery && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-70 flex items-center justify-center">
          <div className="bg-white border-8 border-black p-4 md:p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto relative rounded-xl">
            <button
              onClick={() => setShowGallery(false)}
              className="absolute top-4 right-4 bg-red-500 text-white px-4 py-2 border-4 border-black font-black text-lg uppercase hover:bg-red-600 rounded-lg"
            >
              CLOSE
            </button>
            <h2 className="text-2xl md:text-3xl font-black uppercase mb-4 md:mb-6 text-center">
              My Gallery
            </h2>
            {gallery.length === 0 ? (
              <div className="text-center text-lg font-bold">No images yet.</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
                {gallery.map((img, i) => (
                  <div
                    key={i}
                    className={`border-4 border-black bg-gray-100 p-1 md:p-2 flex flex-col items-center relative rounded-lg ${
                      favorites[img.ts] ? 'ring-4 ring-yellow-400' : ''
                    }`}
                  >
                    <button
                      onClick={() => toggleFavorite(img.ts)}
                      className={`absolute top-2 right-2 z-10 text-2xl md:text-3xl ${
                        favorites[img.ts] ? 'text-yellow-400' : 'text-gray-400'
                      } bg-white bg-opacity-80 rounded-full p-1 md:p-2 focus:outline-none`}
                      aria-label={favorites[img.ts] ? 'Unstar' : 'Star'}
                      tabIndex={0}
                    >
                      ★
                    </button>
                    <img
                      src={img.url}
                      alt="Gallery"
                      className="w-full aspect-square object-contain rounded-md cursor-zoom-in"
                      draggable={false}
                      onContextMenu={(e) => e.preventDefault()}
                      onClick={() => setZoomImage(img.url)}
                    />
                    <div className="mt-2 text-xs font-bold uppercase">{img.style}</div>
                    <div className="text-xs text-gray-500">{new Date(img.ts).toLocaleString()}</div>
                    <button
                      onClick={() => setSelectedGalleryIndex(i)}
                      className="mt-1 text-xs bg-blue-500 text-white px-2 py-1 border-2 border-black font-bold rounded hover:bg-blue-600"
                    >
                      Actions
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Image Lightbox Modal (Zoom) */}
          {zoomImage && (
            <div
              className="fixed inset-0 z-60 bg-black bg-opacity-90 flex items-center justify-center"
              onClick={() => setZoomImage(null)}
            >
              <img
                src={zoomImage}
                alt="Zoomed"
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
          {/* Image Lightbox Modal */}
          {selectedGalleryIndex !== null && gallery[selectedGalleryIndex] && (
            <div className="fixed inset-0 z-60 bg-black bg-opacity-80 flex items-center justify-center">
              <div className="bg-white border-8 border-black p-6 max-w-lg w-full relative flex flex-col items-center rounded-xl">
                <button
                  onClick={() => setSelectedGalleryIndex(null)}
                  className="absolute top-4 right-4 bg-red-500 text-white px-4 py-2 border-4 border-black font-black text-lg uppercase hover:bg-red-600 rounded-lg"
                >
                  CLOSE
                </button>
                <img
                  src={gallery[selectedGalleryIndex].url}
                  alt="Gallery Full"
                  className="w-full max-h-[60vh] object-contain mb-4 rounded-lg"
                  draggable={false}
                  onContextMenu={(e) => e.preventDefault()}
                  onClick={() => setZoomImage(gallery[selectedGalleryIndex].url)}
                  style={{ cursor: 'zoom-in' }}
                />
                <div className="flex gap-4 mb-4">
                  <button
                    onClick={async () => {
                      const response = await fetch(gallery[selectedGalleryIndex].url);
                      const blob = await response.blob();
                      const url = window.URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `snapdraft-image-${gallery[selectedGalleryIndex].style}-${gallery[selectedGalleryIndex].ts}.png`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      window.URL.revokeObjectURL(url);
                    }}
                    className="bg-green-500 text-white px-6 py-2 border-4 border-black font-black text-lg uppercase hover:bg-green-600"
                  >
                    Download
                  </button>
                  <button
                    onClick={() => {
                      const text = `Check out my AI-styled image created with SNAPDRAFT AI!\n\n${gallery[selectedGalleryIndex].url}`;
                      const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
                        text
                      )}`;
                      window.open(url, '_blank');
                    }}
                    className="bg-blue-500 text-white px-6 py-2 border-4 border-black font-black text-lg uppercase hover:bg-blue-600"
                  >
                    Share
                  </button>
                  <button
                    onClick={() => {
                      const newGallery = gallery.filter((_, idx) => idx !== selectedGalleryIndex);
                      localStorage.setItem('snapdraft_gallery', JSON.stringify(newGallery));
                      setGallery(newGallery);
                      setSelectedGalleryIndex(null);
                    }}
                    className="bg-red-500 text-white px-6 py-2 border-4 border-black font-black text-lg uppercase hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
                <div className="text-xs font-bold uppercase">
                  {gallery[selectedGalleryIndex].style}
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(gallery[selectedGalleryIndex].ts).toLocaleString()}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      {/* Neobrutalist Header */}
      <div className="bg-black text-white border-b-8 border-black px-4 py-8 flex flex-col items-center">
        <h1 className="text-6xl md:text-7xl font-black uppercase tracking-tight mb-4 text-center">
          SNAPDRAFT
        </h1>
        <div className="flex items-center gap-x-4 mt-2 justify-center">
          <div className="bg-lime-400 text-black px-6 py-3 inline-block border-4 border-black font-black text-xl uppercase tracking-wide">
            AI IMAGE TRANSFORMER
          </div>
          <button
            onClick={() => setShowGallery(true)}
            className="bg-blue-500 text-white px-6 py-3 border-4 border-black font-black text-lg uppercase hover:bg-blue-600 shadow-[4px_4px_0px_0px_#000000] hover:shadow-[8px_8px_0px_0px_#000000] transition-all"
          >
            My Gallery
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Progress Indicator */}
        <div className="mb-12">
          <div className="flex justify-center space-x-4">
            {['UPLOAD', 'STYLE', 'PREVIEW', 'PAY', 'RESULT'].map((step, index) => {
              const currentStepIndex = ['upload', 'style', 'preview', 'payment', 'result'].indexOf(
                state.step
              );
              const isActive = index <= currentStepIndex;
              const isCurrent = index === currentStepIndex;
              const stepName = step.toLowerCase() as AppState['step'];

              return (
                <button
                  key={step}
                  onClick={() => setStep(stepName)}
                  disabled={!isActive}
                  className={`px-4 py-2 border-4 border-black font-black text-sm uppercase ${
                    isCurrent
                      ? 'bg-yellow-400 text-black'
                      : isActive
                      ? 'bg-green-400 text-black hover:bg-green-500'
                      : 'bg-gray-200 text-gray-600'
                  } ${isActive ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                >
                  {step}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto">
          <div className="bg-white border-8 border-black shadow-[12px_12px_0px_0px_#000000]">
            <div className="bg-black text-white p-6 border-b-8 border-black">
              <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-center">
                {state.step === 'upload' && 'UPLOAD YOUR IMAGE'}
                {state.step === 'style' && 'CHOOSE YOUR STYLE'}
                {state.step === 'preview' && 'PREVIEW YOUR STYLE'}
                {state.step === 'payment' && 'COMPLETE PAYMENT'}
                {state.step === 'result' && 'YOUR STYLED IMAGE'}
              </h2>
              <p className="text-center mt-2 text-lg font-bold uppercase tracking-wide">
                {state.step === 'upload' && "DROP IT LIKE IT'S HOT"}
                {state.step === 'style' && 'PICK YOUR POISON'}
                {state.step === 'preview' && 'SEE BEFORE YOU BUY'}
                {state.step === 'payment' && 'SECURE & FAST'}
                {state.step === 'result' && 'DOWNLOAD & SHARE'}
              </p>
            </div>

            <div className="p-8">
              {state.step === 'upload' && <ImageUpload onImageUpload={handleImageUpload} />}

              {state.step === 'style' && state.originalImage && (
                <StyleSelection
                  originalImage={state.originalImage}
                  onStyleSelect={handleStyleSelect}
                />
              )}

              {state.step === 'preview' && state.originalImage && state.selectedStyle && (
                <StylePreview
                  originalImage={state.originalImage}
                  selectedStyle={state.selectedStyle}
                  onPreviewGenerated={handlePreviewGenerated}
                  onProceedToPayment={handleProceedToPayment}
                  onBackToStyles={() => setState((prev) => ({ ...prev, step: 'style' }))}
                />
              )}

              {state.step === 'payment' && state.originalImage && state.selectedStyle && (
                <PaymentForm
                  originalImage={state.originalImage}
                  selectedStyle={state.selectedStyle}
                  previewImage={state.previewImage}
                  onPaymentSuccess={handlePaymentSuccess}
                  onStyledImageGenerated={handleStyledImageGenerated}
                />
              )}

              {state.step === 'result' && state.styledImage && (
                <ResultDisplay
                  originalImage={state.originalImage!}
                  styledImage={state.styledImage}
                  selectedStyle={state.selectedStyle!}
                  onReset={resetApp}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Neobrutalist Footer */}
      <div className="bg-black text-white border-t-8 border-black mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="font-bold uppercase tracking-wide">© 2025 SNAPDRAFT AI</p>
          </div>
        </div>
      </div>
    </div>
  );
}
