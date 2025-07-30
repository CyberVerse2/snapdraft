'use client';

import { useState, useRef, useEffect } from 'react';
import type { StyleType } from '@/app/page';
import { CreditCard, Shield, Zap } from 'lucide-react';
import Image from 'next/image';
import { getPaymentStatus, pay } from '@base-org/account';

interface PaymentFormProps {
  originalImage: string;
  selectedStyle: StyleType;
  previewImage?: string | null;
  onPaymentSuccess: () => void;
  onStyledImageGenerated: (imageUrl: string) => void;
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
  onStyledImageGenerated
}: PaymentFormProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('');
  const [paymentId, setPaymentId] = useState('');
  const [theme, setTheme] = useState('light');
  const [polling, setPolling] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const [generationProgress, setGenerationProgress] = useState<number>(0);
  const [generationRequestId, setGenerationRequestId] = useState<string | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const styledImageUrlRef = useRef<string | null>(null);
  const [lastRealProgress, setLastRealProgress] = useState(Date.now());

  const handleGenerateImage = async () => {
    setIsProcessing(true);
    setError(null);
    setGenerationProgress(0);
    setGenerationRequestId(null);
    styledImageUrlRef.current = null;
    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ imageUrl: previewImage || originalImage, style: selectedStyle })
      });
      const data = await res.json();
      if (!res.ok || !data.styledImageUrl) {
        throw new Error(data.error || 'Image generation failed');
      }
      if (data.requestId) {
        setGenerationRequestId(data.requestId);
      }
      styledImageUrlRef.current = data.styledImageUrl;
      // Wait for progress to reach 100% before proceeding
    } catch (err: any) {
      setIsProcessing(false);
      setError(err.message || 'An error occurred');
    }
  };

  // One-tap USDC payment using the pay() function
  const handlePayment = async () => {
    setIsProcessing(true);
    setError(null);
    try {
      const result = await pay({
        amount: '0.25', // USD – SDK quotes equivalent USDC
        to: '0xd09e70C83185E9b5A2Abd365146b58Ef0ebb8B7B' // Replace with your recipient address
        // testnet: true // set to false or omit for Mainnet
      });
      if (result.success) {
        setPaymentId(result.id);
        setPaymentStatus('Payment initiated! Waiting for confirmation...');
        setPolling(true);
      } else {
        setError(result.error || 'Payment failed');
        setPaymentStatus('Payment failed');
        setIsProcessing(false);
      }
    } catch (error) {
      setError('Payment failed');
      setPaymentStatus('Payment failed');
      setIsProcessing(false);
    }
  };

  // Check payment status using stored payment ID
  const handlePaymentStatus = async () => {
    if (!paymentId) {
      setPaymentStatus('No payment ID found. Please make a payment first.');
      return false;
    }
    try {
      const { status } = await getPaymentStatus({ id: paymentId });
      setPaymentStatus(`Payment status: ${status}`);
      return status === 'completed';
    } catch (error) {
      setPaymentStatus('Status check failed');
      return false;
    }
  };

  // Poll payment status when polling is enabled
  useEffect(() => {
    if (polling) {
      pollingRef.current = setInterval(async () => {
        const completed = await handlePaymentStatus();
        if (completed) {
          if (pollingRef.current) clearInterval(pollingRef.current);
          setPolling(false);
          setIsProcessing(false);
          handleGenerateImage();
        }
      }, 3000);
      return () => {
        if (pollingRef.current) clearInterval(pollingRef.current);
      };
    }
  }, [polling]);

  // Poll for generation progress
  useEffect(() => {
    if (generationRequestId) {
      progressIntervalRef.current = setInterval(async () => {
        const res = await fetch(`/api/generate-image?id=${generationRequestId}`);
        const data = await res.json();
        if (typeof data.progress === 'number' && data.progress > generationProgress) {
          setGenerationProgress(data.progress);
          setLastRealProgress(Date.now());
        }
        if (data.progress >= 100) {
          if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
          setGenerationRequestId(null);
          setIsProcessing(false);
          setIsGenerating(true);
          if (styledImageUrlRef.current) {
            onStyledImageGenerated(styledImageUrlRef.current);
          }
          onPaymentSuccess();
        }
      }, 200);
      return () => {
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      };
    }
  }, [generationRequestId, generationProgress]);

  // Simulate progress if no real progress for 2 seconds
  useEffect(() => {
    let fakeProgressInterval: NodeJS.Timeout | null = null;
    if (generationRequestId && generationProgress < 100) {
      fakeProgressInterval = setInterval(() => {
        if (Date.now() - lastRealProgress > 2000) {
          setGenerationProgress((prev) => {
            if (prev < 95) {
              return prev + Math.max(2, Math.round((100 - prev) * 0.13));
            }
            return prev;
          });
        }
      }, 200);
    }
    return () => {
      if (fakeProgressInterval) clearInterval(fakeProgressInterval);
    };
  }, [generationRequestId, generationProgress, lastRealProgress]);

  // When upscaling is done, jump to 100%
  useEffect(() => {
    if (!generationRequestId && !isProcessing && isGenerating && generationProgress < 100) {
      setGenerationProgress(100);
    }
  }, [generationRequestId, isProcessing, isGenerating, generationProgress]);

  return (
    <div className="space-y-8">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Order Summary */}
        <div className="bg-white border-8 border-black shadow-[8px_8px_0px_0px_#000000]">
          <div className="bg-black text-white p-4 border-b-8 border-black">
            <h3 className="text-2xl font-black uppercase text-center">ORDER SUMMARY</h3>
          </div>
          <div className="p-6 space-y-6">
            <div className="relative w-full h-48 border-8 border-black shadow-[4px_4px_0px_0px_#000000]">
              <Image
                src={previewImage || originalImage || '/placeholder.svg'}
                alt="Order Preview"
                fill
                className="object-cover"
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-black text-xl uppercase">STYLE:</span>
                <div className="bg-yellow-400 text-black px-6 py-3 border-4 border-black font-black text-xl uppercase">
                  {styleNames[selectedStyle] || selectedStyle?.toUpperCase() || 'UNKNOWN'}
                </div>
              </div>

              <div className="border-t-4 border-black pt-4">
                <div className="flex justify-between items-center">
                  <span className="font-black text-2xl uppercase">TOTAL:</span>
                  <span className="bg-red-500 text-white px-6 py-3 border-4 border-black font-black text-2xl">
                    $0.25
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Details */}
        <div className="bg-white border-8 border-black shadow-[8px_8px_0px_0px_#000000]">
          <div className="bg-black text-white p-4 border-b-8 border-black">
            <h3 className="text-2xl font-black uppercase text-center">
              <CreditCard className="h-6 w-6 mr-2 inline" />
              PAYMENT
            </h3>
          </div>
          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <div className="bg-green-400 text-black p-4 border-4 border-black">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-5 w-5" />
                  <span className="font-black text-lg uppercase">POWERED BY BASE PAY</span>
                </div>
                <p className="font-bold uppercase text-sm">YOUR TRANSACTION IS SAFE AND SECURE</p>
              </div>

              <div className="bg-blue-400 text-black p-4 border-4 border-black">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-5 w-5" />
                  <span className="font-black text-lg uppercase">INSTANT GENERATION</span>
                </div>
                <p className="font-bold uppercase text-sm">
                  HIGH-QUALITY IMAGE READY IN 60 SECONDS
                </p>
              </div>
            </div>

            {/* Payment Button */}
            <button
              onClick={handlePayment}
              disabled={isProcessing || isGenerating || polling || !!generationRequestId}
              className="w-full bg-red-500 text-white py-6 border-4 border-black font-black text-xl uppercase hover:bg-red-600 shadow-[4px_4px_0px_0px_#000000] hover:shadow-[8px_8px_0px_0px_#000000] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generationRequestId
                ? 'UPSCALING IMAGE...'
                : isProcessing || polling
                ? 'PROCESSING PAYMENT...'
                : isGenerating
                ? 'GENERATING IMAGE...'
                : 'PAY $0.25 & GENERATE'}
            </button>

            {error && (
              <div className="bg-red-200 border-4 border-red-500 p-4 text-center font-bold uppercase text-red-700">
                {error}
              </div>
            )}

            <p className="text-center font-bold uppercase text-sm">
              BY CLICKING YOU AGREE TO OUR TERMS
            </p>
          </div>
        </div>
      </div>

      {/* Generation Status */}
      {isGenerating && (
        <div className="bg-yellow-400 border-8 border-black shadow-[8px_8px_0px_0px_#000000]">
          <div className="p-6">
            <div className="flex items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-8 border-black border-t-red-500"></div>
              <div>
                <div className="bg-black text-white px-4 py-2 border-4 border-white font-black text-xl uppercase mb-2">
                  🎨 CREATING MASTERPIECE...
                </div>
                <p className="font-bold text-lg uppercase">THIS USUALLY TAKES 30-60 SECONDS</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
