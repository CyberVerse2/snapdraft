'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useComposeCast } from '@coinbase/onchainkit/minikit';
import Link from 'next/link';
import { BottomNav } from '@/components/bottom-nav';
import { buildShareUrl } from '@/lib/utils';
import { useAccount, useBalance } from 'wagmi';
import { useFarcasterContext } from '@/hooks/use-farcaster-context';
import { FileX2Icon, ImagesIcon } from 'lucide-react';

const RECIPIENT_ADDRESS = '0xd09e70C83185E9b5A2Abd365146b58Ef0ebb8B7B';
const CREDITS_PER_ETH = 42000; // align with homepage (1 ETH ≈ 42,000 credits)

interface GalleryEntry {
  id: string;
  url: string;
  style: string | null;
  createdAt: string;
  originalUrl?: string | null;
}

export default function GalleryPage() {
  // Credits logic
  const { address, isConnected } = useAccount();
  const { data: ethBalance, isLoading: isBalanceLoading } = useBalance({ address });
  const { fid } = useFarcasterContext();
  let credits = 0;
  if (ethBalance && typeof ethBalance.formatted === 'string') {
    const eth = parseFloat(ethBalance.formatted);
    if (!Number.isNaN(eth)) credits = Math.floor(eth * CREDITS_PER_ETH);
  }
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [copied, setCopied] = useState(false);

  // Gallery logic
  const [gallery, setGallery] = useState<GalleryEntry[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string>('');
  const [downloadCopied, setDownloadCopied] = useState(false);
  const { composeCast } = useComposeCast();

  useEffect(() => {
    (async () => {
      if (!fid) {
        setGallery([]);
        return;
      }
      try {
        const res = await fetch(`/api/gallery?fid=${fid}`);
        const data = await res.json();
        if (data?.success) setGallery(data.images);
      } catch {}
    })();
  }, [fid]);

  function handleDelete(id: string) {
    setGallery((prev) => prev.filter((g) => g.id !== id));
  }

  function handleShareToFarcaster(id: string, url: string) {
    const APP_URL =
      process.env.NEXT_PUBLIC_URL || (typeof window !== 'undefined' ? window.location.origin : '');
    const shareText = 'Just styled an image with SNAPDRAFT AI!';
    // Unified helper across app
    const entry = gallery.find((g) => g.id === id);
    const shareUrl = buildShareUrl(
      APP_URL,
      url,
      entry?.originalUrl || undefined,
      entry?.style || undefined
    );
    try {
      console.log('[Share][Gallery] Composing cast with URL:', shareUrl);
    } catch {}
    composeCast({ text: shareText, embeds: [shareUrl] });
  }

  return (
    <div className="flex flex-col min-h-screen bg-yellow-100">
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
            <h2 className="text-2xl font-black uppercase mb-6 text-center">Top Up Credits</h2>
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
          <img
            src="/icon.jpg"
            alt="Snapdraft"
            className="h-8 w-8 sm:h-10 sm:w-10 rounded-sm shrink-0"
          />
          <span className="sr-only">Snapdraft</span>
          {/* Auto-prompt add miniapp handled on load; no manual button */}
        </div>
        <div
          className="bg-yellow-400 text-black px-3 py-2 border-4 border-black font-black text-sm sm:text-lg uppercase rounded-lg text-center truncate min-w-[110px] cursor-pointer hover:bg-yellow-300 transition-all"
          onClick={() => setShowCreditsModal(true)}
        >
          {isConnected ? (isBalanceLoading ? '...' : credits) : 0} Credits
        </div>
      </header>
      {/* Main Content: Gallery Grid */}
      <main className="flex-1 flex flex-col items-center w-full px-2 pt-4 pb-24">
        {gallery.length === 0 ? (
          <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto mt-12 space-y-6">
            {/* Empty state illustration */}
            <div className="w-32 h-32 bg-yellow-200 border-4 border-black rounded-full flex items-center justify-center">
              {/* <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg> */}
              <FileX2Icon className="size-16" />
            </div>

            {/* Empty state text */}
            <div className="text-center space-y-3">
              <h2 className="text-2xl font-black uppercase text-black">Your Gallery is Empty</h2>
              <p className="text-base font-medium text-gray-600 leading-relaxed">
                Start creating amazing AI-styled images to fill your gallery!
              </p>
            </div>

            {/* Call to action */}
            <div className="bg-yellow-400 border-4 border-black rounded-xl p-6 text-center max-w-sm">
              <h3 className="text-lg font-black uppercase text-black mb-3">Ready to Create?</h3>
              <p className="text-sm font-medium text-black mb-4">
                Upload an image, choose a style, and watch the magic happen!
              </p>
              <Link
                href="/"
                className="inline-block bg-red-500 text-white px-6 py-3 border-4 border-black font-black text-base uppercase rounded-lg hover:bg-red-600 transition-all active:scale-95 shadow-[4px_4px_0px_0px_#000000]"
              >
                Start Creating
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 w-full max-w-md mx-auto">
            {gallery.map((entry) => (
              <div
                key={entry.id}
                className="relative group border-4 border-black rounded-xl overflow-hidden bg-white"
              >
                <Image
                  src={entry.url}
                  alt={entry.style || 'Styled Image'}
                  width={200}
                  height={200}
                  className="object-cover w-full h-40"
                />
                <div className="absolute top-2 right-2 flex flex-row gap-2 z-10">
                  <button
                    onClick={() => handleShareToFarcaster(entry.id, entry.url)}
                    className="bg-white border-2 border-black rounded-full p-1 shadow-[2px_2px_0px_0px_#000000] transition-all"
                    aria-label="Share to Farcaster"
                    title="Share to Farcaster"
                  >
                    <img src="/white-purple.svg" alt="Farcaster" className="w-6 h-6" />
                  </button>
                  <button
                    onClick={() => {
                      setDownloadUrl(entry.url);
                      setDownloadCopied(false);
                      setShowDownloadModal(true);
                    }}
                    className="text-xl text-green-600 bg-white border-2 border-black rounded-full p-1 shadow-[2px_2px_0px_0px_#000000] transition-all"
                    aria-label="Download"
                    title="Download / Open"
                  >
                    ⬇
                  </button>
                </div>
                <div className="absolute bottom-2 left-2 bg-yellow-400 text-black px-2 py-1 border-2 border-black font-bold text-xs uppercase rounded-lg">
                  {entry.style || 'STYLE'}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      {showDownloadModal && (
        <div
          className="fixed inset-0 z-[999] bg-black/70 flex items-center justify-center px-4"
          onClick={() => {
            setShowDownloadModal(false);
            setDownloadCopied(false);
          }}
        >
          <div
            className="bg-white border-8 border-black rounded-xl max-w-md w-full p-6 flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-black uppercase text-center">Copy Image Link</h3>
            <div className="bg-gray-100 border-2 border-black rounded-lg px-3 py-2 font-mono text-xs break-all select-all">
              {downloadUrl}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  navigator.clipboard
                    .writeText(downloadUrl)
                    .then(() => {
                      setDownloadCopied(true);
                      setTimeout(() => setDownloadCopied(false), 1500);
                    })
                    .catch(() => {});
                }}
                className="flex-1 bg-yellow-400 text-black px-4 py-2 border-4 border-black font-black uppercase rounded-lg hover:bg-yellow-300"
              >
                {downloadCopied ? 'Copied!' : 'Copy'}
              </button>
              <a
                href={downloadUrl}
                target="_blank"
                rel="noreferrer"
                className="flex-1 text-center bg-blue-500 text-white px-4 py-2 border-4 border-black font-black uppercase rounded-lg hover:bg-blue-600"
              >
                Open
              </a>
            </div>
            <button
              onClick={() => {
                setShowDownloadModal(false);
                setDownloadCopied(false);
              }}
              className="bg-red-500 text-white px-4 py-2 border-4 border-black font-black uppercase rounded-lg hover:bg-red-600"
            >
              Close
            </button>
          </div>
        </div>
      )}
      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
