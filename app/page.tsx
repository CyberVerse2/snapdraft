'use client';

import { pay, getPaymentStatus } from '@base-org/account';
import { useState, useEffect, useRef } from 'react';
import { ImageUpload } from '@/components/image-upload';
import { StyleSelection } from '@/components/style-selection';
import { PaymentForm } from '@/components/payment-form';
import { ResultDisplay } from '@/components/result-display';
import { StylePreview } from '@/components/style-preview';
import { useMiniKit } from '@coinbase/onchainkit/minikit';
import { useFarcasterContext } from '@/hooks/use-farcaster-context';
import { useAccount, useConnect, useBalance } from 'wagmi';
import Link from 'next/link';
import Image from 'next/image';
import sampleHero from '/public/sample-hero.jpg'; // Add a sample image to public/ if not present
import { useEffect as useReactEffect, useState as useReactState } from 'react';

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
// Credits are now denominated in ETH
const CREDITS_PER_ETH = 100000; // 1 ETH = 100,000 credits (adjust as needed)

export default function Home() {
  const { setFrameReady, isFrameReady } = useMiniKit();
  const { fid, isInMiniApp } = useFarcasterContext();
  // The setFrameReady() function is called when your mini-app is ready to be shown
  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);
  // Auto prompt add miniapp if not added, tracked in DB
  useEffect(() => {
    (async () => {
      if (!isFrameReady || !fid) return;
      try {
        const res = await fetch(`/api/miniappprompt?fid=${fid}`);
        const data = await res.json();
        const alreadyAdded = !!data?.frameAdded;
        if (!alreadyAdded && !isInMiniApp) {
          try {
            setFrameReady();
            await fetch('/api/miniappprompt', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ fid, frameAdded: true })
            });
          } catch {}
        }
      } catch {}
    })();
  }, [isFrameReady, isInMiniApp, setFrameReady, fid]);
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
  const { data: ethBalance, isLoading: isBalanceLoading } = useBalance({ address });
  let credits = 0;
  if (ethBalance && typeof ethBalance.formatted === 'string') {
    const eth = parseFloat(ethBalance.formatted);
    if (!Number.isNaN(eth)) credits = Math.floor(eth * CREDITS_PER_ETH);
  }

  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [galleryPage, setGalleryPage] = useState(false);
  const [showUpload, setShowUpload] = useState(true);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const checkWidth = () => setShowUpload(window.innerWidth >= 400);
      checkWidth();
      window.addEventListener('resize', checkWidth);
      return () => window.removeEventListener('resize', checkWidth);
    }
  }, []);
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    localStorage.setItem('snapdraft_credits', credits.toString());
  }, [credits]);

  // Auto-connect wallet in miniapp so credits load immediately
  useEffect(() => {
    if (!isConnected && isInMiniApp && connectors && connectors.length > 0) {
      connect({ connector: connectors[0] });
    }
  }, [isConnected, isInMiniApp, connectors, connect]);

  // Upsert user + daily login credit when Farcaster context is present
  useEffect(() => {
    if (!fid) return;
    (async () => {
      try {
        await fetch('/api/user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fid,
            username: null,
            displayName: null,
            pfpUrl: null,
            walletAddress: address
          })
        });
      } catch {}
      try {
        const res = await fetch('/api/credits/daily', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fid })
        });
        await res.json();
      } catch {}
    })();
  }, [fid, address]);

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
      paymentCompleted: true
    }));
  };

  const handleStyledImageGenerated = async (imageUrl: string) => {
    setState((prev) => ({
      ...prev,
      styledImage: imageUrl
    }));
    // Navigate to result view only after we have the styled image
    setStep('result');
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
    {
      id: 'ghibli',
      name: 'Ghibli',
      description: 'Anime-style fantasy art',
      popular: true,
      thumbnail: '/sample-hero.jpg'
    },
    {
      id: 'anime',
      name: 'Anime',
      description: 'Japanese anime style',
      popular: true,
      thumbnail: '/sample-hero.jpg'
    },
    {
      id: 'cyberpunk',
      name: 'Cyberpunk',
      description: 'Futuristic urban landscape',
      popular: true,
      thumbnail: '/sample-hero.jpg'
    },
    {
      id: 'watercolor',
      name: 'Watercolor',
      description: 'Soft, painterly style',
      popular: true,
      thumbnail: '/sample-hero.jpg'
    },
    {
      id: 'sketch',
      name: 'Sketch',
      description: 'Pencil drawing style',
      popular: true,
      thumbnail: '/sample-hero.jpg'
    },
    {
      id: 'oil-painting',
      name: 'Oil Painting',
      description: 'Rich, textured oil painting',
      popular: true,
      thumbnail: '/sample-hero.jpg'
    },
    {
      id: 'pixel-art',
      name: 'Pixel Art',
      description: 'Retro, blocky style',
      popular: true,
      thumbnail: '/sample-hero.jpg'
    },
    {
      id: 'minecraft',
      name: 'Minecraft',
      description: 'Minecraft-like blocky art',
      popular: true,
      thumbnail: '/sample-hero.jpg'
    }
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

  // Featured image and creator info from DB via API; fallback to local gallery then sample
  const [featuredUrl, setFeaturedUrl] = useReactState<string | null>(null);
  const [featuredUser, setFeaturedUser] = useReactState<{
    username?: string | null;
    pfpUrl?: string | null;
  } | null>(null);
  useReactEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const res = await fetch('/api/featured');
        const data = await res.json();
        if (!ignore && data?.featured?.url) {
          setFeaturedUrl(data.featured.url as string);
          setFeaturedUser({
            username: data.featured?.creator?.username,
            pfpUrl: data.featured?.creator?.pfpUrl
          });
        } else if (!ignore && gallery.length > 0) {
          setFeaturedUrl(gallery[0].url);
        }
      } catch {
        if (!ignore && gallery.length > 0) setFeaturedUrl(gallery[0].url);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [gallery.length]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const handleSimpleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        handleImageUpload(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col min-h-screen bg-yellow-100 overflow-hidden">
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
              Credits are denominated in ETH
              <br />
              Send ETH to this address to top up your credits.
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
        <div className="flex items-center gap-3">
          <h1 className="text-3xl xs:text-3xl sm:text-4xl font-black uppercase tracking-tight text-left">
            SNAP
          </h1>
          {/* Auto-prompt add miniapp handled on load; no manual button */}
        </div>
        <div
          className="bg-yellow-400 text-black px-3 py-2 border-4 border-black font-black text-sm sm:text-lg uppercase rounded-lg text-center truncate min-w-[110px] cursor-pointer hover:bg-yellow-300 transition-all"
          onClick={() => setShowCreditsModal(true)}
        >
          {mounted && isConnected ? (isBalanceLoading ? '...' : credits) : 0} Credits
        </div>
      </header>
      {/* HERO SECTION */}
      {state.step === 'upload' && (
        <>
          <section className="w-full flex flex-col items-center justify-center bg-yellow-100 border-b-4 border-black py-6 px-4">
            <div className="w-full max-w-md mx-auto border-8 border-black rounded-xl overflow-hidden shadow-[8px_8px_0px_0px_#000000] mb-4 relative">
              <Image
                src={featuredUrl || sampleHero}
                alt="Featured AI Styled"
                width={400}
                height={300}
                className="object-cover w-full h-56 transition-opacity duration-500"
                priority
              />
              {featuredUser?.username && (
                <div className="absolute bottom-2 left-2 bg-white/90 border-2 border-black rounded-full px-2 py-1 flex items-center gap-2">
                  {featuredUser.pfpUrl && (
                    <img
                      src={featuredUser.pfpUrl}
                      alt={featuredUser.username || ''}
                      className="w-6 h-6 rounded-full border border-black"
                    />
                  )}
                  <span className="text-xs font-bold">{featuredUser.username}</span>
                </div>
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl font-black uppercase text-center mb-2">
              Your Photos. Reimagined in Seconds.
            </h2>
            {/* <p className="text-lg text-center font-bold text-black/80 mb-2">Upload a photo, pick a style, and get a stunning AI creation in seconds.</p> */}
            <div className="w-full max-w-xs mx-auto mt-2 mb-2 flex justify-center">
              <button
                className="bg-black text-white font-black uppercase px-6 py-3 rounded-lg border-4 border-black shadow-[4px_4px_0px_0px_#000000] hover:bg-yellow-400 hover:text-black transition-all text-base"
                onClick={() => fileInputRef.current?.click()}
                style={{ width: '100%' }}
              >
                Upload Photo
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleSimpleUpload}
              />
            </div>
          </section>
          {/* HOW IT WORKS */}
          <section className="w-full flex flex-col items-center justify-center py-4 px-4 bg-white border-b-4 border-black">
            <div className="flex flex-row items-center justify-center gap-4 max-w-md mx-auto">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-yellow-400 border-4 border-black rounded-sm flex items-center justify-center font-black text-xl mb-1">
                  1
                </div>
                <span className="text-xs font-bold uppercase text-black">UPLOAD</span>
              </div>
              <span className="font-black text-xl">→</span>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-yellow-400 border-4 border-black rounded-sm flex items-center justify-center font-black text-xl mb-1">
                  2
                </div>
                <span className="text-xs font-bold uppercase text-black">STYLE</span>
              </div>
              <span className="font-black text-xl">→</span>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-yellow-400 border-4 border-black rounded-sm flex items-center justify-center font-black text-xl mb-1">
                  3
                </div>
                <span className="text-xs font-bold uppercase text-black">PAY</span>
              </div>
              <span className="font-black text-xl">→</span>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-yellow-400 border-4 border-black rounded-sm flex items-center justify-center font-black text-xl mb-1">
                  4
                </div>
                <span className="text-xs font-bold uppercase text-black">DOWNLOAD</span>
              </div>
            </div>
          </section>
        </>
      )}
      {/* Main Content: Direct, centered, mobile-first layout */}
      <main className="flex-1 flex flex-col items-center justify-center w-full px-4 pb-0 overflow-hidden">
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
                  <img
                    src={style.thumbnail}
                    alt={style.name}
                    className="w-full h-24 object-cover rounded-md border-2 border-black"
                  />
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
          <PaymentForm
            originalImage={state.originalImage!}
            selectedStyle={state.selectedStyle!}
            previewImage={state.previewImage}
            onPaymentSuccess={handlePaymentSuccess}
            onStyledImageGenerated={handleStyledImageGenerated}
            credits={credits}
            onShowTopUpModal={() => setShowCreditsModal(true)}
          />
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
      {/* Bottom Navigation */}
      <footer className="fixed left-0 right-0 bottom-0 z-50 bg-black border-t-4 border-black h-16 flex flex-row items-center justify-between w-full px-2">
        <Link
          href="/"
          className="flex-1 flex items-center justify-center h-full text-white font-black text-base uppercase tracking-tight hover:bg-yellow-400 hover:text-black transition-all"
          style={{ minWidth: 90 }}
        >
          HOME
        </Link>
        <Link
          href="/gallery"
          className="flex-1 flex items-center justify-center h-full text-white font-black text-base uppercase tracking-tight hover:bg-yellow-400 hover:text-black transition-all"
          style={{ minWidth: 90 }}
        >
          GALLERY
        </Link>
      </footer>
    </div>
  );
}
