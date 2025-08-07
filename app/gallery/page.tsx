'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';

interface GalleryEntry {
  url: string;
  style: string | null;
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

export default function GalleryPage() {
  const [gallery, setGallery] = useState<GalleryEntry[]>([]);
  const [favorites, setFavorites] = useState<Record<string, boolean>>(() => {
    if (typeof window === 'undefined') return {};
    try {
      return JSON.parse(localStorage.getItem('snapdraft_favorites') || '{}');
    } catch {
      return {};
    }
  });
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    setGallery(getGallery());
  }, []);

  function toggleFavorite(ts: number) {
    const newFavs = { ...favorites, [ts]: !favorites[ts] };
    setFavorites(newFavs);
    localStorage.setItem('snapdraft_favorites', JSON.stringify(newFavs));
  }

  function handleDelete(ts: number) {
    const newGallery = gallery.filter((g) => g.ts !== ts);
    setGallery(newGallery);
    localStorage.setItem('snapdraft_gallery', JSON.stringify(newGallery));
  }

  function handleShare(url: string) {
    if (navigator.share) {
      navigator.share({
        title: 'My AI Styled Image',
        text: 'Check out this amazing AI-styled image!',
        url
      });
    } else {
      navigator.clipboard.writeText(url);
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <header className="sticky top-0 z-40 bg-black text-white border-b-4 border-black h-16 flex flex-row items-center justify-between w-full px-2 sm:px-4 py-2">
        <h1 className="text-3xl xs:text-3xl sm:text-4xl font-black uppercase tracking-tight text-left">
          GALLERY
        </h1>
      </header>
      <main className="flex-1 flex flex-col items-center w-full px-2 pt-4 pb-24">
        {gallery.length === 0 ? (
          <div className="text-center text-lg font-bold mt-12">No images in your gallery yet.</div>
        ) : (
          <div className="grid grid-cols-2 gap-4 w-full max-w-md mx-auto">
            {gallery.map((entry) => (
              <div
                key={entry.ts}
                className="relative group border-4 border-black rounded-xl overflow-hidden bg-white"
              >
                <Image
                  src={entry.url}
                  alt={entry.style || 'Styled Image'}
                  width={200}
                  height={200}
                  className="object-cover w-full h-40 cursor-pointer"
                  onClick={() => setSelected(entry.ts)}
                />
                <div className="absolute top-2 right-2 flex flex-row gap-2 z-10">
                  <button
                    onClick={() => toggleFavorite(entry.ts)}
                    className={`text-2xl ${
                      favorites[entry.ts] ? 'text-yellow-400' : 'text-gray-400'
                    } bg-white border-2 border-black rounded-full p-1 shadow-[2px_2px_0px_0px_#000000] transition-all`}
                    aria-label={favorites[entry.ts] ? 'Unfavorite' : 'Favorite'}
                  >
                    ★
                  </button>
                  <button
                    onClick={() => handleShare(entry.url)}
                    className="text-xl text-blue-500 bg-white border-2 border-black rounded-full p-1 shadow-[2px_2px_0px_0px_#000000] transition-all"
                    aria-label="Share"
                  >
                    ↗
                  </button>
                  <button
                    onClick={() => handleDelete(entry.ts)}
                    className="text-xl text-red-500 bg-white border-2 border-black rounded-full p-1 shadow-[2px_2px_0px_0px_#000000] transition-all"
                    aria-label="Delete"
                  >
                    🗑
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
    </div>
  );
}
