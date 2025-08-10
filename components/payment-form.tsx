'use client';

import { useState, useRef, useEffect } from 'react';
import type { StyleType } from '@/app/page';
import Image from 'next/image';
import { useAccount, useConnect, useSendTransaction } from 'wagmi';
import { parseEther } from 'viem';
import { useFarcasterContext } from '@/hooks/use-farcaster-context';

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
  onStartGeneration?: (args: { imageUrl: string; style: StyleType; fid?: number | null }) => void;
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
  onShowTopUpModal,
  onStartGeneration
}: PaymentFormProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('');
  const [paymentId, setPaymentId] = useState('');
  const [theme, setTheme] = useState('light');
  const [polling, setPolling] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  // Removed internal generation progress logic
  const styledImageUrlRef = useRef<string | null>(null);
  const [lastRealProgress, setLastRealProgress] = useState(Date.now());

  // Move Wagmi hooks here
  const { isConnected, address } = useAccount();
  const { connect, connectors } = useConnect();
  const { sendTransactionAsync } = useSendTransaction();
  const { fid } = useFarcasterContext();

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
      console.log('[Payment] ETH payment success, firing onPaymentSuccess and starting generation');
      onPaymentSuccess();
      // Delegate generation to parent so result page can show overlay while generating
      onStartGeneration?.({
        imageUrl: previewImage || originalImage,
        style: selectedStyle,
        fid: fid ?? undefined
      });
    }
  };

  // No external status polling for ETH send; we proceed after sendTransaction resolves
  const handlePaymentStatus = async () => true;

  // Removed payment status polling

  // Removed generation progress polling

  // Removed simulated progress

  // Removed upscaling tracking

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
          disabled={isProcessing || polling}
          className="w-full bg-red-500 text-white py-4 border-4 border-black font-black text-xl uppercase rounded-xl hover:bg-red-600 shadow-[4px_4px_0px_0px_#000000] hover:shadow-[8px_8px_0px_0px_#000000] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing || polling ? 'PROCESSING PAYMENT...' : `PAY 7 credits`}
        </button>
      </div>
    </div>
  );
}
