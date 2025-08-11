'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useMiniKit } from '@coinbase/onchainkit/minikit';
import Link from 'next/link';
import { useAccount, useBalance } from 'wagmi';
import { useFarcasterContext } from '@/hooks/use-farcaster-context';

const RECIPIENT_ADDRESS = '0xd09e70C83185E9b5A2Abd365146b58Ef0ebb8B7B';
const CREDITS_PER_ETH = 420000; // align with homepage (1 ETH = 420,000 credits)

interface GalleryEntry {
  id: string;
  url: string;
  style: string | null;
  createdAt: string;
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
  const sdk = useMiniKit();

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
    const shareEmbed = `${APP_URL}/share/${id}`;
    if (sdk && (sdk as any).actions && typeof (sdk as any).actions.composeCast === 'function') {
      (sdk as any).actions.composeCast({ text: shareText, embeds: [shareEmbed] });
    } else if (navigator.share) {
      navigator.share({ title: 'SNAPDRAFT AI', text: shareText, url: shareEmbed }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareEmbed).catch(() => {});
    }
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
      {/* Main Content: Gallery Grid */}
      <main className="flex-1 flex flex-col items-center w-full px-2 pt-4 pb-24">
        {gallery.length === 0 ? (
          <div className="text-center text-lg font-bold mt-12">No images in your gallery yet.</div>
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
      <footer className="fixed left-0 right-0 bottom-0 z-50 bg-black border-t-4 border-black h-20 flex flex-row items-center justify-between w-full sm:px-4">
        <Link
          href="/"
          className="flex-1 flex items-center justify-center h-full text-white font-black text-xl uppercase tracking-tight hover:bg-yellow-400 hover:text-black transition-all active:scale-[0.98]"
          style={{ minWidth: 120 }}
          onClick={() => {
            try {
              navigator.vibrate?.(10);
            } catch {}
          }}
        >
          HOME
        </Link>
        <Link
          href="/gallery"
          className="flex-1 flex items-center justify-center h-full text-white font-black text-xl uppercase tracking-tight hover:bg-yellow-400 hover:text-black transition-all active:scale-[0.98]"
          style={{ minWidth: 120 }}
          onClick={() => {
            try {
              navigator.vibrate?.(10);
            } catch {}
          }}
        >
          GALLERY
        </Link>
      </footer>
    </div>
  );
}
