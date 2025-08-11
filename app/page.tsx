'use client';

import { pay, getPaymentStatus } from '@base-org/account';
import { useState, useEffect, useRef } from 'react';
import { ImageUpload } from '@/components/image-upload';
import { StyleSelection } from '@/components/style-selection';
import { PaymentForm } from '@/components/payment-form';
import { ResultDisplay } from '@/components/result-display';
import { StylePreview } from '@/components/style-preview';
import { useMiniKit, useAddFrame } from '@coinbase/onchainkit/minikit';
import { useFarcasterContext } from '@/hooks/use-farcaster-context';
import { useAccount, useConnect, useBalance } from 'wagmi';
import Link from 'next/link';
import Image from 'next/image';
import sampleHero from '/public/sample-hero.jpg'; // Add a sample image to public/ if not present
import {
  useEffect as useReactEffect,
  useState as useReactState,
  useRef as useReactRef
} from 'react';
import { Upload } from 'lucide-react';
import { BottomNav } from '@/components/bottom-nav';
import { styles } from '@/lib/styles';

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
const CREDITS_PER_ETH = 42000; // 1 ETH ≈ 42,000 credits (ETH ~$4200, 1 credit ≈ $0.10)

export default function Home() {
  const miniKit = useMiniKit() as any;
  const addFrame = useAddFrame();
  const { setFrameReady, isFrameReady } = miniKit || {};
  const { fid, isInMiniApp, username, displayName, pfpUrl } = useFarcasterContext();
  // The setFrameReady() function is called when your mini-app is ready to be shown
  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);
  // Show onboarding ONLY on first homepage load (this session) AND only if user hasn't added the miniapp
  const onboardingCheckedRef = useRef(false);
  useEffect(() => {
    if (onboardingCheckedRef.current) return;
    if (!isFrameReady || !fid) return;
    onboardingCheckedRef.current = true;
    
    // Check if onboarding has already been shown this session
    const onboardingShown = sessionStorage.getItem('snapdraft_onboarding_shown');
    if (onboardingShown) return;
    
    (async () => {
      try {
        const res = await fetch(`/api/miniappprompt?fid=${fid}`);
        const data = await res.json();
        const alreadyAdded = !!data?.frameAdded;
        if (!alreadyAdded) {
          setShowOnboarding(true);
          // Mark onboarding as shown for this session
          sessionStorage.setItem('snapdraft_onboarding_shown', 'true');
        }
      } catch (err) {
        console.warn('[MiniApp] Failed to fetch miniapp prompt status', err);
      }
    })();
  }, [isFrameReady, fid]);
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
  const [showOnboarding, setShowOnboarding] = useState(false);
  // (Optional) Live preview state was used before; now previews happen in the Preview step only
  // Recent gallery per-style images for style cards
  const [styleImagesMap, setStyleImagesMap] = useReactState<Record<string, string[]>>({
    ghibli: [
      '/hero-4.jpg',
      '/hero-8.jpg',
    ],
    // Anime style - vibrant, Japanese anime aesthetic
    anime: [
      '/hero-10.jpg'
    ],
    // Watercolor style - soft, artistic, painterly
    watercolor: [
      '/hero-3.jpg',
    ],
    // Sketch style - black and white, pencil-like
    sketch: [
      '/hero-2.jpg',
    ],
    // Oil painting style - textured, classical art
    "oil-painting": [
      '/hero-7.jpg',
      '/sample-hero.jpg',
    ],
    // Minecraft style - blocky, cubic aesthetic
    minecraft: [
      '/hero-9.jpg',
      '/hero-6.jpg',
    ]
  });
  const [stylePreviewIndex, setStylePreviewIndex] = useReactState<Record<string, number>>({});
  const stylesScrollerRef = useReactRef<HTMLDivElement | null>(null);
  const [spinning, setSpinning] = useState(false);
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
  // Dismiss onboarding for this session
  const dismissOnboarding = () => {
    setShowOnboarding(false);
    // Mark onboarding as shown for this session
    sessionStorage.setItem('snapdraft_onboarding_shown', 'true');
  };

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
            username,
            displayName,
            pfpUrl,
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
  }, [fid, address, username, displayName, pfpUrl]);

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
      selectedStyle: style
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
    console.log('[Payment] Success received, navigating to result overlay');
    setState((prev) => ({
      ...prev,
      paymentCompleted: true,
      step: 'result'
    }));
  };

  const handleStyledImageGenerated = async (imageUrl: string) => {
    console.log('[Generation] Styled image URL received:', imageUrl);
    setState((prev) => ({
      ...prev,
      styledImage: imageUrl
    }));
    // Do not navigate here; navigation to result happens only after successful payment
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

  // Styles now sourced from lib/styles.ts

  // Add favorite logic for result
  const resultKey = state.styledImage ? `${state.styledImage}_${state.selectedStyle}` : null;
  const isResultFavorite = resultKey ? !!favorites[resultKey] : false;
  function handleResultFavorite() {
    if (!resultKey) return;
    const newFavs = { ...favorites, [resultKey]: !favorites[resultKey] };
    setFavorites(newFavs);
    localStorage.setItem('snapdraft_favorites', JSON.stringify(newFavs));
  }

  // Featured image: show default only; do not fetch from DB
  const [featuredUrl, setFeaturedUrl] = useReactState<string | null>('/sample-hero.jpg');
  const [featuredUser, setFeaturedUser] = useReactState<{ username: string; pfpUrl: string } | null>(null);
  
  // Slideshow state
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isSlideshowPlaying, setIsSlideshowPlaying] = useState(true);
  const slideshowImages = [
    '/sample-hero.jpg',
    '/hero-3.jpg',
    '/hero-4.jpg',
    '/hero-5.jpeg',
    '/hero-6.jpg'
  ];
  
  // Auto-advance slideshow
  useEffect(() => {
    if (!isSlideshowPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentSlideIndex((prevIndex) => (prevIndex + 1) % slideshowImages.length);
    }, 5000); // Change slide every 5 seconds
    
    return () => clearInterval(interval);
  }, [slideshowImages.length, isSlideshowPlaying]);
  const [recentImages, setRecentImages] = useReactState<
    Array<{ url: string; username?: string | null; pfpUrl?: string | null }>
  >([]);
  const [recentIndex, setRecentIndex] = useReactState<number>(0);
  // Do not fetch featured or recent images; keep default only

  // Default a style when entering style step
  useEffect(() => {
    if (state.step === 'style' && !state.selectedStyle) {
      setState((prev) => ({ ...prev, selectedStyle: 'ghibli' }));
    }
  }, [state.step, state.selectedStyle]);

  // (Removed) Auto preview in style step; previews happen only when tapping Preview

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
    <div className="flex flex-col h-screen bg-yellow-100 overflow-hidden">
      {/* Credits Modal */}
      {showCreditsModal && (
        <div
          className="fixed inset-0 z-[1000] bg-black bg-opacity-70 flex items-center justify-center px-4"
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
      {/* Onboarding Modal (bottom sheet, 50% height) */}
      {showOnboarding && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={dismissOnboarding} />
          <div className="absolute left-0 right-0 bottom-0 max-h-[80vh] bg-white border-t-8 border-black rounded-t-2xl shadow-[0_-8px_0_0_#000000] pb-4">
            <div className="h-1 w-16 bg-black rounded-full mx-auto mt-2" />
            <div className="p-4 flex flex-col items-center text-center gap-3">
              <h3 className="font-display text-2xl font-black uppercase">Welcome to Snapdraft</h3>
              <p className="text-sm font-bold text-black/80">
                Transform your photos into stunning AI-styled artwork in seconds.
              </p>
              {/* Redesigned steps: centered connector line passing through badges */}
              <div className="w-full max-w-md mx-auto mt-2 relative">
                {/* connector line */}
                <div className="absolute left-4 right-4 top-[28px] h-2 bg-yellow-300 border-4 border-black rounded-full z-0" />
                <div className="grid grid-cols-4 gap-2 relative z-10">
                  {[
                    { n: 1, label: 'Upload' },
                    { n: 2, label: 'Style' },
                    { n: 3, label: 'Pay' },
                    { n: 4, label: 'Download' }
                  ].map((s) => (
                    <div key={s.n} className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-yellow-400 border-4 border-black flex items-center justify-center font-black text-xl">
                        {s.n}
                      </div>
                      <span className="text-[10px] font-black uppercase mt-1">{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Add Mini App button */}
              <button
                className="mt-3 bg-yellow-400 text-black px-6 py-3 border-4 border-black font-black text-base uppercase rounded-lg hover:bg-yellow-300 active:scale-[0.98]"
                onClick={async () => {
                  try {
                    navigator.vibrate?.(10);
                  } catch {}
                  console.log('[Onboarding] Add Mini App clicked', { fid });
                  try {
                    const result = await addFrame();
                    if (result) {
                      console.log('Frame added:', result.url, result.token);
                      if (fid) {
                        await fetch('/api/miniappprompt', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            fid,
                            frameAdded: true,
                            miniappUrl: result.url,
                            miniappToken: result.token
                          })
                        });
                      }
                      dismissOnboarding();
                    }
                  } catch (e) {
                    console.error('[Onboarding] Add Mini App failed', e);
                  }
                }}
              >
                Add Mini App
              </button>
              <button
                className="mt-2 text-xs font-bold uppercase underline"
                onClick={dismissOnboarding}
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Sticky Header: SNAP (left), Credits (right) */}
      <header className="fixed top-0 z-40 bg-black text-white border-b-4 border-black h-16 w-full flex flex-row items-center justify-between px-4 py-2">
        <div className="flex items-center gap-3">
          <img
            src="/icon.jpg"
            alt="Snapdraft"
            className="h-8 w-8 sm:h-10 sm:w-10 rounded-sm shrink-0"
          />
          <span className="sr-only">Snapdraft</span>
          {/* Auto-prompt add miniapp handled on load; no manual button */}
        </div>
        <button
          type="button"
          className="bg-yellow-400 text-black px-3 py-2 border-4 border-black font-black text-sm sm:text-lg uppercase rounded-lg text-center truncate min-w-[110px] cursor-pointer hover:bg-yellow-300 active:scale-[0.98] transition-all"
          onClick={() => setShowCreditsModal(true)}
          aria-haspopup="dialog"
          aria-expanded={showCreditsModal}
        >
          {mounted && isConnected ? (isBalanceLoading ? '...' : credits) : 0} Credits
        </button>
      </header>
      {/* Spacer below fixed header (more space on style step) */}
      <div className={state.step === 'style' ? 'h-20' : ''} />
      {/* HERO SECTION */}
      {state.step === 'upload' && (
        <>
          <section className="w-full flex flex-col items-center justify-center bg-yellow-100 py-6 px-4 flex-1">
            <div className="w-full max-w-md mx-auto border-8 border-black rounded-xl overflow-hidden shadow-[8px_8px_0px_0px_#000000] mb-4 relative">
              <div className="relative w-full h-56">
                {slideshowImages.map((image, index) => (
                  <Image
                    key={image}
                    src={image}
                    alt={`Featured AI Styled ${index + 1}`}
                    width={400}
                    height={300}
                    className={`absolute inset-0 object-cover w-full h-full transition-opacity duration-1000 ${
                      index === currentSlideIndex ? 'opacity-100' : 'opacity-0'
                    }`}
                    priority={index === 0}
                    onClick={() => {
                      // Manual advance on click
                      setCurrentSlideIndex((prevIndex) => (prevIndex + 1) % slideshowImages.length);
                    }}
                  />
                ))}
              </div>
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
              Your Photos Reimagined As Art.
            </h2>
            {/* Community strip: recent creations */}
            {recentImages.length > 0 && (
              <div className="w-full max-w-md mx-auto px-2 mb-2">
                <div className="flex overflow-x-auto gap-2 py-1">
                  {recentImages.slice(0, 12).map((img, idx) => (
                    <div key={`${img.url}-${idx}`} className="flex-shrink-0">
                      <img
                        src={img.url}
                        alt={img.username || 'Recent'}
                        className="h-16 w-16 object-cover rounded-md border-2 border-black"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* <p className="text-lg text-center font-bold text-black/80 mb-2">Upload a photo, pick a style, and get a stunning AI creation in seconds.</p> */}
            <div className="w-full max-w-md mx-auto mt-2 mb-2 flex flex-col md:flex-row gap-3 justify-center px-2">
              <button
                className="flex-1 bg-purple-600 text-white font-black uppercase px-4 py-3 rounded-lg border-4 border-black shadow-[4px_4px_0px_0px_#000000] hover:bg-purple-500 active:scale-[0.98] transition-all text-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                onClick={() => {
                  if (pfpUrl) {
                    try {
                      navigator.vibrate?.(10);
                    } catch {}
                    handleImageUpload(pfpUrl);
                  } else {
                    try {
                      navigator.vibrate?.(10);
                    } catch {}
                  }
                }}
                disabled={!pfpUrl}
              >
                {pfpUrl && (
                  <img
                    src={pfpUrl}
                    alt="Profile"
                    className="w-8 h-8 rounded-full border-2 border-black bg-white"
                  />
                )}
                <span>Use Profile Photo</span>
              </button>
              <button
                className="flex-1 bg-black text-white font-black uppercase px-4 py-3 rounded-lg border-4 border-black shadow-[4px_4px_0px_0px_#000000] hover:bg-yellow-400 hover:text-black active:scale-[0.98] transition-all text-sm flex items-center justify-center gap-2"
                onClick={() => {
                  try {
                    navigator.vibrate?.(10);
                  } catch {}
                  fileInputRef.current?.click();
                }}
              >
                <Upload className="w-6 h-6 sm:w-7 sm:h-7" />
                <span>Upload Photo</span>
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
          {/* Removed HOW IT WORKS section (moved into onboarding modal) */}
        </>
      )}
      {/* Main Content: Direct, centered, mobile-first layout */}
      <section
        className={`flex flex-col items-center ${
          state.step === 'style' ? 'justify-start' : 'justify-center'
        } w-full px-4 pb-0 overflow-hidden`}
      >
        {/* Style Selection Step */}
        {state.step === 'style' && (
          <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto gap-1">
            {/* Style cards horizontally */}
            <div
              ref={stylesScrollerRef}
              className="w-full h-[54vh] overflow-x-auto no-scrollbar flex flex-row gap-4 snap-x snap-mandatory pb-1 mt-1"
              aria-label="Style selector"
            >
              {styles.map((style) => {
                const imgs =
                  styleImagesMap[style.id] && styleImagesMap[style.id].length > 0
                    ? styleImagesMap[style.id]
                    : [style.thumbnail];
                const idx = stylePreviewIndex[style.id] || 0;
                const main = imgs[Math.min(idx, imgs.length - 1)];
                return (
                  <div
                    key={style.id}
                    className={`snap-center flex-shrink-0 w-[80%] bg-white border-4 border-black rounded-xl overflow-hidden shadow-[8px_8px_0px_0px_#000000] ${
                      state.selectedStyle === style.id ? 'ring-4 ring-yellow-400' : ''
                    }`}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleStyleSelect(style.id as StyleType)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ')
                        handleStyleSelect(style.id as StyleType);
                    }}
                    aria-pressed={state.selectedStyle === style.id}
                  >
                    <img
                      src={imgs[0]}
                      alt={style.name}
                      className="w-full h-[36vh] object-cover border-b-4 border-black"
                    />
                    <div className="p-2 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-black uppercase">{style.name}</span>
                        {style.popular && (
                          <span className="text-[10px] bg-yellow-300 text-black px-2 py-0.5 rounded font-bold">
                            POPULAR
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-gray-600 leading-snug whitespace-normal break-words">
                        {style.description}
                      </span>
                      {/* Mini previews */}
                      <div className="flex gap-2 overflow-x-auto no-scrollbar">
                        {imgs.slice(0, 8).map((u, i) => (
                          <button
                            key={`${style.id}-${i}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setStylePreviewIndex((prev) => ({ ...prev, [style.id]: i }));
                            }}
                            className={`border-2 ${
                              i === idx ? 'border-black' : 'border-gray-300'
                            } rounded-md overflow-hidden`}
                            aria-label={`Preview ${style.name} ${i + 1}`}
                          >
                            <img src={u} alt="preview" className="h-10 w-10 object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Guidance */}
            <div className="text-center text-[11px] font-bold text-black/70">
              Tap a card to select · Click 'Suprise Me' for a random style.
            </div>
            {/* Preview Button */}
            <button
              className="w-full bg-yellow-400 text-black py-3 border-4 border-black font-black text-base uppercase rounded-xl hover:bg-yellow-300 active:scale-[0.98] shadow-[4px_4px_0px_0px_#000000] transition-all disabled:opacity-60"
              onClick={() => {
                try {
                  navigator.vibrate?.(10);
                } catch {}
                if (!state.selectedStyle) return;
                handleProceedToPayment();
              }}
              disabled={!state.selectedStyle}
            >
              Preview
            </button>
            {/* Jackpot Spin Button */}
            <button
              className="w-full mt-2 bg-red-500 text-white py-3 border-4 border-black font-black text-base uppercase rounded-xl hover:bg-red-600 active:scale-[0.98] shadow-[4px_4px_0px_0px_#000000] transition-all disabled:opacity-60"
              onClick={async () => {
                if (spinning || styles.length === 0) return;
                setSpinning(true);
                const container = stylesScrollerRef.current;
                if (!container) {
                  setSpinning(false);
                  return;
                }
                const targetIndex = Math.floor(Math.random() * styles.length);
                // Spin effect: quick scrolls then decelerate
                let elapsed = 0;
                const duration = 1800;
                const start = performance.now();
                const baseSpeed = 12;
                const spin = (now: number) => {
                  elapsed = now - start;
                  const t = Math.min(1, elapsed / duration);
                  const speed = baseSpeed * (1 - t) + 2; // decelerate
                  container.scrollLeft += speed;
                  if (elapsed < duration) {
                    requestAnimationFrame(spin);
                  } else {
                    // Snap to target card
                    const card = container.children[targetIndex] as HTMLElement | undefined;
                    if (card) {
                      const left = Math.max(
                        0,
                        card.offsetLeft - (container.clientWidth - card.offsetWidth) / 2
                      );
                      container.scrollTo({ left, behavior: 'smooth' });
                    }
                    const picked = styles[targetIndex].id as StyleType;
                    setState((prev) => ({ ...prev, selectedStyle: picked }));
                    setTimeout(() => {
                      handleProceedToPayment();
                      setSpinning(false);
                    }, 2000);
                  }
                };
                requestAnimationFrame(spin);
              }}
              disabled={spinning}
            >
              {spinning ? 'SPINNING...' : 'Surprise me'}
            </button>
          </div>
        )}
        {state.step === 'preview' && state.originalImage && state.selectedStyle && (
          <div className="w-full max-w-md mx-auto">
            <StylePreview
              originalImage={state.originalImage}
              selectedStyle={state.selectedStyle}
              onPreviewGenerated={handlePreviewGenerated}
              onProceedToPayment={handleProceedToPayment}
              onBackToStyles={() => setStep('style')}
            />
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
            onBackToUpload={() => setStep('upload')}
            onBackToStyle={() => setStep('style')}
          />
        )}
        {/* Result Step */}
        {state.step === 'result' && (
          <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto gap-4">
            {state.styledImage ? (
              <ResultDisplay
                originalImage={state.originalImage || ''}
                styledImage={state.styledImage}
                selectedStyle={(state.selectedStyle || styles[0].id) as StyleType}
                onReset={() => setStep('upload')}
              />
            ) : (
              <div className="text-sm font-bold uppercase text-black">Preparing your image...</div>
            )}
          </div>
        )}
      </section>
      {/* Bottom Navigation (hidden during onboarding) */}
      {!showOnboarding && <BottomNav />}
    </div>
  );
}
