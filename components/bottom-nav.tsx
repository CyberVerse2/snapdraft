'use client';

import Link from 'next/link';

export function BottomNav() {
  const handleClick = () => {
    try {
      navigator.vibrate?.(10);
    } catch {}
  };

  return (
    <footer className="fixed left-0 right-0 bottom-0 z-[80] bg-black border-t-4 border-black h-16 flex flex-row items-center justify-between w-full px-2">
      <Link
        href="/"
        className="flex-1 flex items-center justify-center h-full text-white font-black text-base uppercase tracking-tight hover:bg-yellow-400 hover:text-black transition-all active:scale-[0.98]"
        style={{ minWidth: 90 }}
        onClick={handleClick}
      >
        HOME
      </Link>
      <Link
        href="/gallery"
        className="flex-1 flex items-center justify-center h-full text-white font-black text-base uppercase tracking-tight hover:bg-yellow-400 hover:text-black transition-all active:scale-[0.98]"
        style={{ minWidth: 90 }}
        onClick={handleClick}
      >
        GALLERY
      </Link>
    </footer>
  );
}

