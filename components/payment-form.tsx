'use client';

import { useState, useRef, useEffect } from 'react';
import type { StyleType } from '@/app/page';
import { CreditCard, Shield, Zap } from 'lucide-react';
import Image from 'next/image';
import { getPaymentStatus, pay } from '@base-org/account';

interface PaymentFormProps {
  originalImage: string;
  selectedStyle: StyleType;
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
  'pixel-art': 'PIXEL ART'
};

export function PaymentForm({
  originalImage,
  selectedStyle,
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

  const handleGenerateImage = async () => {
    setIsProcessing(true);
    setError(null);
    try {
      // This will now directly call the image generation endpoint.
      // We will add actual payment and image generation logic later.
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ imageUrl: originalImage, style: selectedStyle })
      });

      if (!res.ok) {
        // For now, let's assume the happy path and simulate success
        // throw new Error('Image generation failed');
        console.warn('Image generation API call failed, but simulating success for now.');
      }

      // const data = await res.json();
      const data = {
        styledImageUrl:
          'https://replicate.delivery/pbxt/J1dxpCjJg1fUAS8GgzCak2TqO2p3g6L5D5vGN9j23i5YyHElA/output.png'
      }; // Placeholder

      setIsProcessing(false);
      setIsGenerating(true);
      onPaymentSuccess();
      // Simulate image generation delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setIsGenerating(false);
      onStyledImageGenerated(data.styledImageUrl);
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
        amount: '0.5', // USD – SDK quotes equivalent USDC
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
                src={originalImage || '/placeholder.svg'}
                alt="Original"
                fill
                className="object-cover"
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-bold text-lg uppercase">STYLE:</span>
                <div className="bg-yellow-400 text-black px-4 py-2 border-4 border-black font-black text-lg uppercase">
                  {styleNames[selectedStyle]}
                </div>
              </div>

              <div className="border-t-4 border-black pt-4">
                <div className="flex justify-between items-center">
                  <span className="font-black text-2xl uppercase">TOTAL:</span>
                  <span className="bg-red-500 text-white px-6 py-3 border-4 border-black font-black text-2xl">
                    $0.50
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
              disabled={isProcessing || isGenerating}
              className="w-full bg-red-500 text-white py-6 border-4 border-black font-black text-xl uppercase hover:bg-red-600 shadow-[4px_4px_0px_0px_#000000] hover:shadow-[8px_8px_0px_0px_#000000] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing && (
                <div className="animate-spin rounded-full h-6 w-6 border-b-4 border-white mr-3 inline-block"></div>
              )}
              {isGenerating && <div className="animate-pulse mr-3 inline">🎨</div>}
              {isProcessing
                ? 'PROCESSING PAYMENT...'
                : isGenerating
                ? 'GENERATING IMAGE...'
                : 'PAY $0.50 & GENERATE'}
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
