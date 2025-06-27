'use client';

import { useState } from 'react';
import type { StyleType } from '@/app/page';
import { CreditCard, Shield, Zap } from 'lucide-react';
import Image from 'next/image';
import { usePrivy } from '@privy-io/react-auth';

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
  const [showX402Pay, setShowX402Pay] = useState(false);
  const [x402PaymentRequirements, setX402PaymentRequirements] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const { login, logout, ready, authenticated, user } = usePrivy();
  const wallet = user?.wallet;
  const walletAddress = wallet?.address;
  console.log('Privy wallet object:', wallet);

  // Handle real x402 payment using official Quickstart for Buyers flow
  const handleX402Pay = async () => {
    setIsProcessing(true);
    setError(null);
    try {
      if (!walletAddress || !wallet) {
        setIsProcessing(false);
        setError('Please connect your wallet first.');
        return;
      }
      // Parse payment requirements from 402 response
      console.log('--- x402 Payment Flow Start ---');
      console.log('x402PaymentRequirements:', x402PaymentRequirements);
      const req = x402PaymentRequirements?.accepts?.[0];
      console.log('Parsed payment requirements (req):', req);
      if (!req || !req.payTo)
        throw new Error('Payment requirements missing or payTo address not found.');
      const payToAddress = req.payTo;
      const network = req.network;
      const asset = req.asset;
      const scheme = req.scheme;
      const amount = req.maxAmountRequired;
      console.log(
        'Using payToAddress:',
        payToAddress,
        'network:',
        network,
        'asset:',
        asset,
        'scheme:',
        scheme,
        'amount:',
        amount
      );
      // Use window.ethereum for injected wallets
      const { ethers } = await import('ethers');
      if (!(window.ethereum as any)) {
        setIsProcessing(false);
        setError('No injected wallet found. Please install MetaMask or another wallet.');
        return;
      }
      const BASE_CHAIN_ID = 8453; // Base mainnet
      const BASE_CHAIN_ID_HEX = '0x2105'; // 8453 in hex
      if ((window.ethereum as any).networkVersion !== '8453') {
        try {
          await (window.ethereum as any).request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: BASE_CHAIN_ID_HEX }]
          });
        } catch (switchError) {
          setIsProcessing(false);
          setError('Please switch your wallet to the Base network to continue.');
          return;
        }
      }
      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const networkInfo = await provider.getNetwork();
      console.log('Current network:', networkInfo);
      if (Number(networkInfo.chainId) !== BASE_CHAIN_ID) {
        setIsProcessing(false);
        setError('Please switch your wallet to the Base network to continue.');
        return;
      }
      // If already on Base, proceed as normal
      const signer = await provider.getSigner();
      const usdcAbi = ['function transfer(address to, uint256 amount) public returns (bool)'];
      const usdc = new ethers.Contract(asset, usdcAbi, signer);
      console.log('Calling USDC transfer on Base...');
      const tx = await usdc.transfer(payToAddress, amount);
      const receipt = await tx.wait();
      const txHash = receipt.hash;
      setTxHash(txHash);
      console.log('USDC transfer txHash:', txHash);
      // Construct the X-PAYMENT payload
      const paymentProof = {
        txHash,
        from: walletAddress,
        to: payToAddress,
        value: amount,
        asset
      };
      const paymentPayload = {
        x402Version: 1,
        scheme: scheme || 'exact',
        network: network || 'base',
        payload: paymentProof
      };
      console.log('Constructed X-PAYMENT payload:', paymentPayload);
      const xPaymentHeader = btoa(JSON.stringify(paymentPayload));
      console.log('X-PAYMENT header (base64):', xPaymentHeader);
      setShowX402Pay(false);
      await handleGenerateImage(xPaymentHeader);
      console.log('--- x402 Payment Flow End ---');
    } catch (err: any) {
      setError(err.message || 'Payment failed');
      console.error('x402 Payment Error:', err);
    }
    setIsProcessing(false);
  };

  const handleGenerateImage = async (xPaymentHeader?: string) => {
    setIsProcessing(true);
    setError(null);
    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(xPaymentHeader ? { 'X-PAYMENT': xPaymentHeader } : {})
        },
        body: JSON.stringify({ imageUrl: originalImage, style: selectedStyle })
      });
      if (res.status === 402) {
        // Payment required: show x402 Pay UI
        const data = await res.json();
        setX402PaymentRequirements(data);
        setShowX402Pay(true);
        setIsProcessing(false);
        return;
      }
      if (!res.ok) {
        throw new Error('Image generation failed');
      }
      const data = await res.json();
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
                  <span className="font-black text-lg uppercase">SECURE PAYMENT</span>
                </div>
                <p className="font-bold uppercase text-sm">PAYMENT POWERED BY COINBASE x402 PAY</p>
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

            {/* Payment Button or x402 Pay UI */}
            {!showX402Pay ? (
              <button
                onClick={() => handleGenerateImage()}
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
            ) : (
              <div className="space-y-4">
                {/* Paywall UI: Connect wallet and pay */}
                <div className="bg-yellow-200 border-4 border-black p-4 text-center font-bold uppercase">
                  Payment required. Please complete payment using x402 Pay.
                </div>
                {!walletAddress ? (
                  <button
                    onClick={login}
                    disabled={isProcessing || !ready}
                    className="w-full bg-blue-500 text-white py-4 border-4 border-black font-black text-lg uppercase hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? 'CONNECTING...' : 'CONNECT WALLET'}
                  </button>
                ) : (
                  <button
                    onClick={handleX402Pay}
                    disabled={isProcessing}
                    className="w-full bg-green-500 text-white py-4 border-4 border-black font-black text-lg uppercase hover:bg-green-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? 'PROCESSING...' : 'PAY $0.50 (USDC)'}
                  </button>
                )}
                {walletAddress && (
                  <div className="mt-2 text-xs text-gray-700 text-center">
                    Connected: {walletAddress}
                  </div>
                )}
                {txHash && <div className="text-xs text-green-700 mt-2">Tx: {txHash}</div>}
              </div>
            )}

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
