'use client';

import { pay, getPaymentStatus } from '@base-org/account';
import { useState, useEffect } from 'react';
import { ImageUpload } from '@/components/image-upload';
import { StyleSelection } from '@/components/style-selection';
import { PaymentForm } from '@/components/payment-form';
import { ResultDisplay } from '@/components/result-display';
import { StylePreview } from '@/components/style-preview';
import { useMiniKit } from '@coinbase/onchainkit/minikit';
import { useAccount, useConnect, useReadContract } from 'wagmi';
import { erc20Abi } from 'viem';

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

const RECIPIENT_ADDRESS = '0xd09e70C83185E9b5A2Abd365146b58Ef0ebb8B7B';
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'; // Base Mainnet USDC
const USDC_DECIMALS = 6;
const CREDITS_PER_USDC = 100; // 1 USDC = 100 credits (1 credit = $0.01)

export default function Home() {
  const { setFrameReady, isFrameReady } = useMiniKit();
  // The setFrameReady() function is called when your mini-app is ready to be shown
  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);
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
  const [favorites, setFavorites] = useState<Record<string, boolean>>(() => {
    if (typeof window === 'undefined') return {};
    try {
      return JSON.parse(localStorage.getItem('snapdraft_favorites') || '{}');
    } catch {
      return {};
    }
  });
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  // Credits state
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const usdcReadArgs = address ? ([address as `0x${string}`] as const) : undefined;
  const { data: usdcBalanceRaw, isLoading: isBalanceLoading } = useReadContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: usdcReadArgs
  });
  if (address) {
    console.log('Querying USDC balance for address:', address);
  }
  if (usdcBalanceRaw) {
    console.log('Raw USDC balance:', usdcBalanceRaw.toString());
  }
  let credits = 0;
  if (usdcBalanceRaw && typeof usdcBalanceRaw === 'bigint') {
    credits = (Number(usdcBalanceRaw) / 10 ** USDC_DECIMALS) * CREDITS_PER_USDC;
    credits = Math.floor(credits);
  }

  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [galleryPage, setGalleryPage] = useState(false);

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
      step: 'payment'
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

  // Add favorite logic for result
  const resultKey = state.styledImage ? `${state.styledImage}_${state.selectedStyle}` : null;
  const isResultFavorite = resultKey ? !!favorites[resultKey] : false;
  function handleResultFavorite() {
    if (!resultKey) return;
    const newFavs = { ...favorites, [resultKey]: !favorites[resultKey] };
    setFavorites(newFavs);
    localStorage.setItem('snapdraft_favorites', JSON.stringify(newFavs));
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Credits Modal */}
      {showCreditsModal && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-70 flex items-center justify-center px-4"
          onClick={() => setShowCreditsModal(false)}
        >
          <div
            className="bg-white border-8 border-black rounded-xl max-w-md w-full p-6 flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Title */}
            <h2 className="text-2xl font-black uppercase mb-6 text-center">Top Up Credits</h2>
            {/* Address and Copy Button in one row */}
            <div className="mb-4 w-full flex items-center justify-center gap-2">
              <div className="bg-gray-100 border-2 border-black rounded-lg px-4 py-2 font-mono text-sm break-all inline-block">
                {RECIPIENT_ADDRESS.slice(0, 6)}...{RECIPIENT_ADDRESS.slice(-5)}
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(RECIPIENT_ADDRESS);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
                className="bg-yellow-400 text-black px-3 py-1 border-2 border-black font-bold rounded hover:bg-yellow-300 transition-all"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div className="text-center text-base font-bold mt-2 mb-6">
              1 credit = $0.01 USDC
              <br />
              Send USDC to this address to top up your credits.
            </div>
            {/* Close button: centered below text */}
            <button
              onClick={() => setShowCreditsModal(false)}
              className="mt-4 bg-red-500 text-white px-6 py-2 border-4 border-black font-black text-base uppercase hover:bg-red-600 rounded-lg"
            >
              CLOSE
            </button>
          </div>
        </div>
      )}
      {/* Sticky Header: SNAP (left), Credits (right) */}
      <header className="sticky top-0 z-40 bg-black text-white border-b-4 border-black h-16 flex flex-row items-center justify-between w-full px-2 sm:px-4 py-2">
        <h1 className="text-3xl xs:text-3xl sm:text-4xl font-black uppercase tracking-tight text-left">
          SNAP
        </h1>
        <div
          className="bg-yellow-400 text-black px-3 py-2 border-4 border-black font-black text-sm sm:text-lg uppercase rounded-lg text-center truncate min-w-[110px] cursor-pointer hover:bg-yellow-300 transition-all"
          onClick={() => setShowCreditsModal(true)}
        >
          {isConnected ? (isBalanceLoading ? '...' : credits) : 0} Credits
        </div>
      </header>
      {/* Main Content: Direct, centered, mobile-first layout */}
      <main className="flex-1 flex flex-col items-center justify-center w-full px-4 pb-24">
        {/* Upload Step */}
        {state.step === 'upload' && !galleryPage && (
          <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto gap-6">
            <ImageUpload onImageUpload={handleImageUpload} />
          </div>
        )}
        {/* Style Selection Step */}
        {state.step === 'style' && (
          <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto gap-6">
            <h2 className="text-2xl font-black uppercase text-center mb-2">Choose Style</h2>
            <div className="w-full overflow-x-auto flex flex-row gap-4 pb-2 snap-x snap-mandatory">
              {styles.map((style) => (
                <button
                  key={style.id}
                  className={`min-w-[140px] max-w-[180px] snap-center flex-shrink-0 bg-gray-100 border-4 border-black rounded-xl p-3 flex flex-col items-center justify-center gap-2 shadow-md ${
                    state.selectedStyle === style.id ? 'ring-4 ring-yellow-400' : ''
                  } min-h-[56px] hover:bg-yellow-200 transition-all`}
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
        {/* Payment Step */}
        {state.step === 'payment' && (
          <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto gap-6">
            <PaymentForm
              originalImage={state.originalImage || ''}
              selectedStyle={(state.selectedStyle || styles[0].id) as StyleType}
              previewImage={state.previewImage || ''}
              onPaymentSuccess={handlePaymentSuccess}
              onStyledImageGenerated={handleStyledImageGenerated}
            />
          </div>
        )}
        {/* Result Step */}
        {state.step === 'result' && (
          <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto gap-6">
            <ResultDisplay
              originalImage={state.originalImage || ''}
              styledImage={state.styledImage || ''}
              selectedStyle={(state.selectedStyle || styles[0].id) as StyleType}
              onReset={() => setStep('upload')}
              isFavorite={isResultFavorite}
              onFavorite={handleResultFavorite}
            />
          </div>
        )}
      </main>
      {/* Navigation remains as is */}
      {/* Sticky Bottom Navigation Bar (mobile-first) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black border-t-8 border-black flex flex-row justify-around items-center h-16 sm:h-20 w-full">
        <button
          onClick={() => {
            setGalleryPage(false);
            setStep('upload');
          }}
          className={`flex-1 flex flex-col items-center justify-center h-full text-white font-black uppercase text-xs sm:text-base transition-all ${
            !galleryPage ? 'bg-yellow-400 text-black' : 'bg-black text-white'
          }`}
        >
          <span className="material-icons text-2xl sm:text-3xl mb-1">home</span>
        </button>
        <button
          onClick={() => setGalleryPage(true)}
          className={`flex-1 flex flex-col items-center justify-center h-full text-white font-black uppercase text-xs sm:text-base transition-all ${
            galleryPage ? 'bg-yellow-400 text-black' : 'bg-black text-white'
          }`}
        >
          <span className="material-icons text-2xl sm:text-3xl mb-1">Gallery</span>
        </button>
      </nav>
      {/* Gallery Page (full page, not modal) */}
      {galleryPage ? (
        <div className="min-h-[80vh] bg-white border-8 border-black p-2 sm:p-4 max-w-md mx-auto w-full flex flex-col relative rounded-xl">
          <h2 className="text-xl sm:text-2xl font-black uppercase mb-4 text-center">My Gallery</h2>
          {gallery.length === 0 ? (
            <div className="text-center text-base font-bold">No images yet.</div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {gallery.map((img, i) => (
                <div
                  key={i}
                  className={`border-4 border-black bg-gray-100 p-1 flex flex-col items-center relative rounded-lg ${
                    favorites[img.ts] ? 'ring-4 ring-yellow-400' : ''
                  }`}
                >
                  <button
                    onClick={() => toggleFavorite(img.ts)}
                    className={`absolute top-1 right-1 z-10 text-2xl ${
                      favorites[img.ts] ? 'text-yellow-400' : 'text-gray-400'
                    } bg-white bg-opacity-80 rounded-full p-2 focus:outline-none`}
                    aria-label={favorites[img.ts] ? 'Unstar' : 'Star'}
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
                    style={{ touchAction: 'pan-x pan-y pinch-zoom' }}
                  />
                  <div className="mt-2 text-xs font-bold uppercase truncate w-full text-center">
                    {img.style}
                  </div>
                  <div className="text-xs text-gray-500 truncate w-full text-center">
                    {new Date(img.ts).toLocaleString()}
                  </div>
                  <div className="flex flex-row gap-2 mt-2 w-full justify-center">
                    <button
                      onClick={async () => {
                        const response = await fetch(img.url);
                        const blob = await response.blob();
                        const url = window.URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = `snapdraft-image-${img.style}-${img.ts}.png`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        window.URL.revokeObjectURL(url);
                      }}
                      className="bg-green-500 text-white px-3 py-2 border-4 border-black font-black text-xs uppercase rounded-lg flex-1 hover:bg-green-600"
                    >
                      Download
                    </button>
                    <button
                      onClick={() => {
                        const text = `Check out my AI-styled image created with SNAPDRAFT AI!\n\n${img.url}`;
                        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
                          text
                        )}`;
                        window.open(url, '_blank');
                      }}
                      className="bg-blue-500 text-white px-3 py-2 border-4 border-black font-black text-xs uppercase rounded-lg flex-1 hover:bg-blue-600"
                    >
                      Share
                    </button>
                    <button
                      onClick={() => {
                        const newGallery = gallery.filter((_, idx) => idx !== i);
                        setGallery(newGallery);
                        localStorage.setItem('snapdraft_gallery', JSON.stringify(newGallery));
                      }}
                      className="bg-red-500 text-white px-3 py-2 border-4 border-black font-black text-xs uppercase rounded-lg flex-1 hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
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
        </div>
      ) : null}
    </div>
  );
}
