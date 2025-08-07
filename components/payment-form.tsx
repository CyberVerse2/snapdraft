'use client';

import { useState, useRef, useEffect } from 'react';
import type { StyleType } from '@/app/page';
import { CreditCard, Shield, Zap } from 'lucide-react';
import Image from 'next/image';
import { getPaymentStatus, pay } from '@base-org/account';
import { ethers } from 'ethers';
import { useAccount, useConnect, useWriteContract } from 'wagmi';
import { erc20Abi } from 'viem';

const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'; // Replace with Base USDC if needed
const RECIPIENT_ADDRESS = '0xd09e70C83185E9b5A2Abd365146b58Ef0ebb8B7B';
const CREDITS_PRICE = 10; // 10 credits
const USDC_DECIMALS = 6;

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

  // Move Wagmi hooks here
  const { isConnected, address } = useAccount();
  const { connect, connectors } = useConnect();
  const { writeContractAsync } = useWriteContract();

  async function handleErc20PaymentWagmi(
    setError: (e: string) => void,
    setProcessing: (b: boolean) => void
  ) {
    try {
      setProcessing(true);
      setError('');
      if (!isConnected) {
        await connect({ connector: connectors[0] });
      }
      const amount = BigInt(Math.floor((CREDITS_PRICE * 10 ** USDC_DECIMALS) / 100));
      console.log('total', amount);
      await writeContractAsync({
        address: USDC_ADDRESS,
        abi: erc20Abi,
        functionName: 'transfer',
        args: [RECIPIENT_ADDRESS, amount]
      });
      setProcessing(false);
      return true;
    } catch (e: any) {
      setError(e.message || 'ERC20 payment failed');
      setProcessing(false);
      return false;
    }
  }

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
    if (credits < 10) {
      onShowTopUpModal();
      return;
    }
    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      // Desktop: use Base Pay
      try {
        setIsProcessing(true);
        setError('');
        const result = await pay({
          amount: (CREDITS_PRICE * 0.01).toFixed(2),
          to: RECIPIENT_ADDRESS
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
    } else {
      // Mobile: use Wagmi ERC-20 transfer
      const success = await handleErc20PaymentWagmi(setError, setIsProcessing);
      if (success) {
        setPaymentStatus('Payment complete!');
        setIsProcessing(false);
        setPolling(false);
        onPaymentSuccess();
      }
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
          if (previewImage) {
            onStyledImageGenerated(previewImage);
          }
          onPaymentSuccess();
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
    <div className="fixed left-0 right-0 top-16 bottom-14 z-50 bg-yellow-100 overflow-y-auto">
      {/* Main content: center everything, no scroll */}
      <div className="flex-1 flex flex-col items-center justify-start w-full max-w-md mx-auto px-4 pt-8 pb-24">
        {/* Preview Image */}
        <div className="w-full max-w-md mx-auto border-8 border-black object-cover overflow-hidden max-h-80 mt-2 shadow-[8px_8px_0px_0px_#000000]">
          <Image
            src={previewImage || originalImage || '/placeholder.svg'}
            alt="Order Preview"
            width={320}
            height={320}
            className="object-cover w-full h-auto max-h-80"
          />
        </div>
        {/* Style and Total distributed vertically */}
        <div className="flex flex-col gap-6 w-full mt-6 flex-shrink-0">
          <div className="flex justify-between items-center w-full">
            <span className="font-black text-xl uppercase">STYLE:</span>
            <span className="bg-yellow-400 text-black px-6 py-1 border-4 border-black font-black text-xl uppercase rounded-lg">
              {styleNames[selectedStyle] || selectedStyle?.toUpperCase() || 'UNKNOWN'}
            </span>
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
        <button
          onClick={handlePayment}
          disabled={isProcessing || isGenerating || polling || !!generationRequestId}
          className="w-full bg-red-500 text-white py-4 border-4 border-black font-black text-xl uppercase rounded-xl hover:bg-red-600 shadow-[4px_4px_0px_0px_#000000] hover:shadow-[8px_8px_0px_0px_#000000] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {generationRequestId
            ? 'UPSCALING IMAGE...'
            : isProcessing || polling
            ? 'PROCESSING PAYMENT...'
            : isGenerating
            ? 'GENERATING IMAGE...'
            : 'PAY 10 credits'}
        </button>
      </div>
    </div>
  );
}
