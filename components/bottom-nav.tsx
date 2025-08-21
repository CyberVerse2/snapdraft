'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function BottomNav() {
  const pathname = usePathname();
  const isHome = pathname === '/';
  const isGallery = pathname === '/gallery';

  const handleClick = () => {
    try {
      navigator.vibrate?.(10);
    } catch {}
  };

  const handleHomeClick: React.MouseEventHandler<HTMLAnchorElement> = (e) => {
    handleClick();
    if (isHome) {
      e.preventDefault();
      try {
        window.dispatchEvent(new CustomEvent('snapdraft:go-upload'));
      } catch {}
    }
  };

  return (
    <footer className="fixed left-0 right-0 bottom-0 z-[80] bg-black border-t-4 border-black h-16 flex flex-row items-center justify-between w-full ">
      <Link
        href="/"
        className={`flex-1 flex items-center justify-center h-full font-black text-base uppercase tracking-tight transition-all active:scale-[0.98] ${
          isHome ? 'bg-yellow-400 text-black' : 'text-white hover:bg-yellow-400 hover:text-black'
        }`}
        style={{ minWidth: 90 }}
        onClick={handleHomeClick}
      >
        HOME
      </Link>
      <Link
        href="/gallery"
        className={`flex-1 flex items-center justify-center h-full font-black text-base uppercase tracking-tight transition-all active:scale-[0.98] ${
          isGallery ? 'bg-yellow-400 text-black' : 'text-white hover:bg-yellow-400 hover:text-black'
        }`}
        style={{ minWidth: 90 }}
        onClick={handleClick}
      >
        GALLERY
      </Link>
    </footer>
  );
}
