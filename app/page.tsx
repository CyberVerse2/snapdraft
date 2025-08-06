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
  | 'pixel-art'
  | 'minecraft';

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
  // Credits state
  const [credits, setCredits] = useState(() => {
    if (typeof window === 'undefined') return 100;
    const stored = localStorage.getItem('snapdraft_credits');
    return stored ? parseInt(stored, 10) : 100;
  });

  useEffect(() => {
    localStorage.setItem('snapdraft_credits', credits.toString());
  }, [credits]);

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
    // Deduct 25 credits per image
    setCredits((prev) => Math.max(0, prev - 25));
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

  const styles = [
    { id: 'ghibli', name: 'Ghibli', description: 'Anime-style fantasy art', popular: true },
    { id: 'anime', name: 'Anime', description: 'Japanese anime style', popular: true },
    {
      id: 'cyberpunk',
      name: 'Cyberpunk',
      description: 'Futuristic urban landscape',
      popular: true
    },
    { id: 'watercolor', name: 'Watercolor', description: 'Soft, painterly style', popular: true },
    { id: 'sketch', name: 'Sketch', description: 'Pencil drawing style', popular: true },
    {
      id: 'oil-painting',
      name: 'Oil Painting',
      description: 'Rich, textured oil painting',
      popular: true
    },
    { id: 'pixel-art', name: 'Pixel Art', description: 'Retro, blocky style', popular: true },
    { id: 'minecraft', name: 'Minecraft', description: 'Minecraft-like blocky art', popular: true }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Gallery Modal */}
      {showGallery && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-70 flex items-center justify-center px-2">
          <div className="bg-white border-8 border-black p-2 sm:p-4 md:p-8 max-w-3xl w-full max-h-[80vh] md:max-h-[90vh] overflow-y-auto relative rounded-xl">
            <button
              onClick={() => setShowGallery(false)}
              className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-red-500 text-white px-3 py-2 sm:px-4 sm:py-2 border-4 border-black font-black text-base sm:text-lg uppercase hover:bg-red-600 rounded-lg"
            >
              CLOSE
            </button>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black uppercase mb-2 sm:mb-4 md:mb-6 text-center">
              My Gallery
            </h2>
            {gallery.length === 0 ? (
              <div className="text-center text-base sm:text-lg font-bold">No images yet.</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 md:gap-4">
                {gallery.map((img, i) => (
                  <div
                    key={i}
                    className={`border-4 border-black bg-gray-100 p-1 md:p-2 flex flex-col items-center relative rounded-lg ${
                      favorites[img.ts] ? 'ring-4 ring-yellow-400' : ''
                    }`}
                  >
                    <button
                      onClick={() => toggleFavorite(img.ts)}
                      className={`absolute top-1 right-1 sm:top-2 sm:right-2 z-10 text-xl sm:text-2xl md:text-3xl ${
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
      {/* Sticky Header: SNAP (left), Credits (right) */}
      <header className="sticky top-0 z-40 bg-black text-white border-b-8 border-black px-2 sm:px-4 py-4 flex flex-row items-center justify-between w-full">
        <h1 className="text-2xl xs:text-3xl sm:text-4xl font-black uppercase tracking-tight text-left">
          SNAP
        </h1>
        <div className="bg-yellow-400 text-black px-3 py-2 border-4 border-black font-black text-sm sm:text-lg uppercase rounded-lg text-center truncate min-w-[110px]">
          Credits: {credits}
        </div>
      </header>

      <div className="container mx-auto px-2 sm:px-4 py-6 sm:py-12 pb-24">
        {' '}
        {/* Add pb-24 for bottom nav space */}
        {/* Progress Indicator */}
        <div className="mb-6 sm:mb-12 overflow-x-auto">
          <div className="flex justify-center space-x-2 sm:space-x-4 min-w-[340px]">
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
                  className={`px-2 sm:px-4 py-1 sm:py-2 border-4 border-black font-black text-xs sm:text-sm uppercase ${
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
        {/* Main Content: Mobile-first, step-by-step card UI */}
        <div className="w-full max-w-md mx-auto flex flex-col gap-6 pb-24">
          {/* Step 1: Upload */}
          {state.step === 'upload' && (
            <div className="bg-white border-4 border-black rounded-2xl shadow-lg p-4 flex flex-col items-center">
              <h2 className="text-xl font-black uppercase mb-2 text-center">Upload Image</h2>
              <ImageUpload onImageUpload={handleImageUpload} />
              <button
                className="mt-4 bg-blue-500 text-white px-6 py-3 border-4 border-black font-black text-lg uppercase rounded-xl w-full max-w-xs hover:bg-blue-600"
                onClick={() => handleImageUpload('/sample.jpg')}
              >
                Use Sample Image
              </button>
            </div>
          )}
          {/* Step 2: Style Selection (swipeable) */}
          {state.step === 'style' && (
            <div className="bg-white border-4 border-black rounded-2xl shadow-lg p-4 flex flex-col items-center">
              <h2 className="text-xl font-black uppercase mb-2 text-center">Choose Style</h2>
              <div className="w-full overflow-x-auto flex flex-row gap-4 pb-2 snap-x snap-mandatory">
                {styles.map((style) => (
                  <button
                    key={style.id}
                    className={`min-w-[140px] max-w-[180px] snap-center flex-shrink-0 bg-gray-100 border-4 border-black rounded-xl p-3 flex flex-col items-center justify-center gap-2 shadow-md ${
                      state.selectedStyle === style.id ? 'ring-4 ring-yellow-400' : ''
                    }`}
                    onClick={() => handleStyleSelect(style.id as StyleType)}
                  >
                    <span className="text-lg font-black uppercase">{style.name}</span>
                    <span className="text-xs text-gray-500">{style.description}</span>
                    {style.popular && (
                      <span className="text-xs bg-yellow-300 text-black px-2 py-1 rounded font-bold mt-1">
                        POPULAR
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
          {/* Step 3: Preview */}
          {state.step === 'preview' && (
            <div className="bg-white border-4 border-black rounded-2xl shadow-lg p-4 flex flex-col items-center">
              <h2 className="text-xl font-black uppercase mb-2 text-center">Preview</h2>
              <StylePreview
                originalImage={state.originalImage || ''}
                selectedStyle={(state.selectedStyle || styles[0].id) as StyleType}
                onPreviewGenerated={handlePreviewGenerated}
                onProceedToPayment={handleProceedToPayment}
                onBackToStyles={() => setStep('style')}
              />
              <button
                className="mt-4 bg-gray-200 text-black px-6 py-3 border-4 border-black font-black text-lg uppercase rounded-xl w-full max-w-xs hover:bg-gray-300"
                onClick={() => setStep('style')}
              >
                Try Another Style
              </button>
            </div>
          )}
          {/* Step 4: Payment */}
          {state.step === 'payment' && (
            <div className="bg-white border-4 border-black rounded-2xl shadow-lg p-4 flex flex-col items-center">
              <h2 className="text-xl font-black uppercase mb-2 text-center">Payment</h2>
              <PaymentForm
                originalImage={state.originalImage || ''}
                selectedStyle={(state.selectedStyle || styles[0].id) as StyleType}
                previewImage={state.previewImage || ''}
                onPaymentSuccess={handlePaymentSuccess}
                onStyledImageGenerated={handleStyledImageGenerated}
              />
            </div>
          )}
          {/* Step 5: Result */}
          {state.step === 'result' && (
            <div className="bg-white border-4 border-black rounded-2xl shadow-lg p-4 flex flex-col items-center">
              <h2 className="text-xl font-black uppercase mb-2 text-center">Result</h2>
              <ResultDisplay
                originalImage={state.originalImage || ''}
                styledImage={state.styledImage || ''}
                selectedStyle={(state.selectedStyle || styles[0].id) as StyleType}
                onReset={() => setStep('upload')}
              />
            </div>
          )}
        </div>
      </div>
      {/* Sticky Bottom Navigation Bar (mobile-first) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black border-t-8 border-black flex flex-row justify-around items-center h-16 sm:h-20 w-full">
        <button
          onClick={() => setStep('upload')}
          className={`flex-1 flex flex-col items-center justify-center h-full text-white font-black uppercase text-xs sm:text-base transition-all ${
            state.step === 'upload' ? 'bg-yellow-400 text-black' : 'bg-black text-white'
          }`}
        >
          <span className="material-icons text-2xl sm:text-3xl mb-1">home</span>
        </button>
        <button
          onClick={() => setShowGallery(true)}
          className={`flex-1 flex flex-col items-center justify-center h-full text-white font-black uppercase text-xs sm:text-base transition-all ${
            showGallery ? 'bg-yellow-400 text-black' : 'bg-black text-white'
          }`}
        >
          <span className="material-icons text-2xl sm:text-3xl mb-1">Gallery</span>
        </button>
      </nav>
    </div>
  );
}
