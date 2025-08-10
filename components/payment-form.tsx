'use client';

import { useState, useRef, useEffect } from 'react';
import type { StyleType } from '@/app/page';
import { useAccount, useConnect, useSendTransaction } from 'wagmi';
import { parseEther } from 'viem';
import { useFarcasterContext } from '@/hooks/use-farcaster-context';
import { RotateCw } from 'lucide-react';

const RECIPIENT_ADDRESS = '0xd09e70C83185E9b5A2Abd365146b58Ef0ebb8B7B';
const CREDITS_PRICE = 30; // 30 credits per image
const CREDITS_PER_ETH = 420000; // 1 ETH = 420k credits (ETH ~$4200, 1 credit ~= $0.01)

interface PaymentFormProps {
  originalImage: string;
  selectedStyle: StyleType;
  previewImage?: string | null;
  onPaymentSuccess: () => void;
  onStyledImageGenerated: (imageUrl: string) => void;
  credits: number;
  onShowTopUpModal: () => void;
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

export function PaymentForm({
  originalImage,
  selectedStyle,
  previewImage,
  onPaymentSuccess,
  onStyledImageGenerated,
  credits,
  onShowTopUpModal
}: PaymentFormProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('');
  const [paymentId, setPaymentId] = useState('');
  const [theme, setTheme] = useState('light');
  const [polling, setPolling] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  // Generation states (moved here from StylePreview per requirements)
  const [showOriginal, setShowOriginal] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<number>(0);
  const [generationRequestId, setGenerationRequestId] = useState<string | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const hasNotifiedRef = useRef<boolean>(false);
  const [paymentComplete, setPaymentComplete] = useState<boolean>(false);
  const hasNavigatedRef = useRef<boolean>(false);
  const encouragementItems = ['✨ 4X RESOLUTION', '🎨 ENHANCED DETAILS', '💎 PREMIUM QUALITY'];
  const [encIndex, setEncIndex] = useState<number>(0);
  // Guards to prevent duplicate generations (StrictMode and rapid re-renders)
  const generationInFlightRef = useRef<boolean>(false);
  const lastGenerationKeyRef = useRef<string | null>(null);

  // Move Wagmi hooks here
  const { isConnected, address } = useAccount();
  const { connect, connectors } = useConnect();
  const { sendTransactionAsync } = useSendTransaction();
  const { fid } = useFarcasterContext();

  // Start image generation on mount or when inputs change
  async function startGeneration() {
    let cancelled = false;
    try {
      if (generationInFlightRef.current) {
        return () => {
          /* no-op */
        };
      }
      generationInFlightRef.current = true;
      setError(null);
      setGenerationProgress(0);
      setGenerationRequestId(null);
      setGeneratedUrl(null);
      hasNotifiedRef.current = false;
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: previewImage || originalImage,
          style: selectedStyle,
          fid
        })
      });
      const data = await res.json();
      if (!res.ok || !data.styledImageUrl) {
        throw new Error(data.error || 'Image generation failed');
      }
      if (data.requestId) setGenerationRequestId(data.requestId);
      if (!cancelled) {
        setGeneratedUrl(data.styledImageUrl as string);
        // Proactively notify parent with the URL so result page has it ready
        if (!hasNotifiedRef.current && typeof onStyledImageGenerated === 'function') {
          hasNotifiedRef.current = true;
          onStyledImageGenerated(data.styledImageUrl as string);
        }
      }
    } catch (e: any) {
      if (!cancelled) setError(e?.message || 'Failed to start generation');
    }
    return () => {
      cancelled = true;
      generationInFlightRef.current = false;
    };
  }

  useEffect(() => {
    const key = `${previewImage || originalImage}|${selectedStyle}`;
    if (lastGenerationKeyRef.current === key) {
      return;
    }
    lastGenerationKeyRef.current = key;
    let cleanup: any;
    (async () => {
      cleanup = await startGeneration();
    })();
    return () => {
      if (typeof cleanup === 'function') cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [originalImage, previewImage, selectedStyle]);

  // Auto-advance encouragement carousel text
  useEffect(() => {
    const id = setInterval(() => {
      setEncIndex((i) => (i + 1) % encouragementItems.length);
    }, 2000);
    return () => clearInterval(id);
  }, []);

  const handleRegenerate = async () => {
    await startGeneration();
  };

  // Poll for generation progress (and simulate increments if backend updates are sparse)
  useEffect(() => {
    // Stop any progress updates once the image is ready
    if (generatedUrl) {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      return;
    }
    let lastTick = Date.now();
    progressIntervalRef.current = setInterval(async () => {
      // If we have a request id, try to fetch real progress updates
      if (generationRequestId) {
        try {
          const res = await fetch(`/api/generate-image?id=${generationRequestId}`);
          const data = await res.json();
          if (typeof data.progress === 'number') {
            setGenerationProgress((prev) => Math.max(prev, data.progress));
          }
        } catch {}
      }
      // Simulate a slightly slower increment if no real update for >0.9s
      const now = Date.now();
      if (now - lastTick > 900) {
        lastTick = now;
        setGenerationProgress((prev) => {
          if (prev >= 97) return prev;
          const boost = Math.max(1, Math.round((100 - prev) * 0.08));
          return Math.min(97, prev + boost);
        });
      }
    }, 500);
    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [generationRequestId, generatedUrl]);

  // When completed, notify parent once
  useEffect(() => {
    if (!generationRequestId && generatedUrl && !hasNotifiedRef.current) {
      hasNotifiedRef.current = true;
      onStyledImageGenerated(generatedUrl);
    }
  }, [generationRequestId, generatedUrl, onStyledImageGenerated]);

  // If payment already completed, navigate to result as soon as image is ready
  useEffect(() => {
    if (paymentComplete && generatedUrl && !hasNavigatedRef.current) {
      hasNavigatedRef.current = true;
      onPaymentSuccess();
    }
  }, [paymentComplete, generatedUrl, onPaymentSuccess]);

  async function sendEthPayment(): Promise<boolean> {
    try {
      setIsProcessing(true);
      setError('');
      if (!isConnected) {
        await connect({ connector: connectors[0] });
      }
      const ethAmount = (CREDITS_PRICE / CREDITS_PER_ETH).toFixed(18);
      await sendTransactionAsync({
        to: RECIPIENT_ADDRESS as `0x${string}`,
        value: parseEther(ethAmount)
      });
      setIsProcessing(false);
      return true;
    } catch (e: any) {
      setError(e.message || 'ETH payment failed');
      setIsProcessing(false);
      return false;
    }
  }

  // Removed local handleGenerateImage; parent handles generation

  // ETH payment based on credits-to-ETH conversion
  const handlePayment = async () => {
    if (credits < CREDITS_PRICE) {
      onShowTopUpModal();
      return;
    }
    console.log('[Payment] Starting ETH payment');
    const success = await sendEthPayment();
    if (success) {
      setPaymentStatus('Payment complete!');
      setIsProcessing(false);
      setPolling(false);
      console.log('[Payment] ETH payment success');
      setPaymentComplete(true);
      // If generation already finished, navigate immediately
      if (generatedUrl && !hasNavigatedRef.current) {
        hasNavigatedRef.current = true;
        onPaymentSuccess();
      }
    }
  };

  // No external status polling for ETH send; we proceed after sendTransaction resolves
  const handlePaymentStatus = async () => true;

  // Removed payment status polling

  // Removed generation progress polling

  // Removed simulated progress

  // Removed upscaling tracking

  return (
    <div className="fixed left-0 right-0 top-16 bottom-14 z-50 bg-yellow-100 overflow-y-auto overflow-x-hidden">
      {/* Main content: center everything, no scroll */}
      <div className="flex-1 flex flex-col items-center justify-start w-full max-w-md mx-auto px-4 pt-4 pb-24">
        {/* Preview Image */}
        <div className="w-full max-w-md mx-auto border-8 border-black object-cover overflow-hidden max-h-80 mt-1 shadow-[8px_8px_0px_0px_#000000]">
          <div
            className="relative w-full h-auto max-h-80 cursor-pointer"
            onClick={() => setShowOriginal((v) => !v)}
          >
            <img
              src={
                (showOriginal ? originalImage : generatedUrl) ||
                previewImage ||
                originalImage ||
                '/placeholder.svg'
              }
              alt={showOriginal ? 'Original' : 'Generated'}
              className="object-cover w-full h-auto max-h-80"
            />
            {!generatedUrl && (generationRequestId || generationProgress < 100) && (
              <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center space-y-4">
                <div className="relative">
                  <div
                    className="rounded-full h-24 w-24 border-8 border-black"
                    style={{ background: `conic-gradient(#fde047 ${generationProgress}%, #fff 0)` }}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-black text-white px-3 py-1 font-black text-sm uppercase">
                        {`${Math.max(
                          0,
                          Math.min(
                            99,
                            Math.floor(
                              Number.isFinite(generationProgress as number)
                                ? (generationProgress as number)
                                : 0
                            )
                          )
                        )}%`}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-yellow-400 text-black px-3 py-1 border-4 border-black font-black text-xs uppercase tracking-tight">
                  Generating preview — hold tight!
                </div>
              </div>
            )}
          </div>
        </div>
        {/* Style and Total distributed vertically */}
        <div className="flex flex-col gap-3 w-full mt-4 flex-shrink-0">
          <div className="flex justify-between items-center w-full">
            <span className="font-black text-base uppercase">STYLE:</span>
            <span className="bg-yellow-400 text-black px-3 py-0.5 border-2 border-black font-black text-sm uppercase rounded-lg">
              {styleNames[selectedStyle] || selectedStyle?.toUpperCase() || 'UNKNOWN'}
            </span>
          </div>
        </div>
        {/* Encouragement block from Style Preview */}
        <div className="w-full max-w-md mx-auto mt-12">
          <div className="space-y-2">
            <p className="font-black text-lg uppercase text-center leading-none">
              LOVE IT? GET THE FULL QUALITY!
            </p>
            <div className="flex items-center justify-center h-8 overflow-hidden">
              <div
                key={encIndex}
                className="bg-white text-black px-2 py-1 border-4 border-black whitespace-nowrap text-[11px] font-bold uppercase rounded-sm transition-opacity duration-300"
              >
                {encouragementItems[encIndex]}
              </div>
            </div>
          </div>
        </div>
        {/* Error/status message above pay button */}
        {error && (
          <div className="bg-red-200 border-4 border-red-500 p-4 text-center font-bold uppercase text-red-700 w-full max-w-md mx-auto mt-4">
            {error}
          </div>
        )}
      </div>
      {/* Pay Button: always visible, sticky above nav */}
      <div className="fixed left-0 right-0 bottom-20 w-full px-4 z-[70]">
        <div className="flex gap-3 items-center">
          <button
            onClick={handlePayment}
            disabled={isProcessing || polling}
            className="flex-[2] bg-red-500 text-white py-3 border-4 border-black font-black text-base uppercase rounded-xl hover:bg-red-600 shadow-[4px_4px_0px_0px_#000000] hover:shadow-[8px_8px_0px_0px_#000000] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing || polling ? 'PROCESSING...' : `PAY ${CREDITS_PRICE} credits`}
          </button>
          <button
            onClick={handleRegenerate}
            className="w-14 h-[52px] bg-white text-black border-4 border-black rounded-xl hover:bg-gray-100 shadow-[4px_4px_0px_0px_#000000] transition-all flex items-center justify-center"
            aria-label="Regenerate preview"
            title="Regenerate preview"
          >
            <RotateCw className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
