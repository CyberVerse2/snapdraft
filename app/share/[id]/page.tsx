import type { Metadata } from 'next';
import React from 'react';

type PageProps = {
  params: { id: string };
  searchParams: Record<string, string | string[] | undefined>;
};

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const URL = process.env.NEXT_PUBLIC_URL || '';
  const appName = process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME || 'Snap';
  const splashImageUrl = `${URL}/icon.jpg`;
  const splashBackgroundColor = '#000000';

  const decoded = (() => {
    try {
      return decodeURIComponent(params.id || '');
    } catch {
      return '';
    }
  })();
  const fromPath = /^https?:\/\//i.test(decoded) ? decoded : undefined;

  const get = (k: string) => {
    const v = searchParams?.[k];
    return Array.isArray(v) ? v[0] : v;
  };

  const gen = get('gen') || fromPath;
  const orig = get('orig') || gen;
  const label = get('label');

  const imageUrl = (() => {
    if (!gen) return `${URL}/og.jpg`;
    const qs = new URLSearchParams();
    qs.set('gen', gen);
    qs.set('orig', orig || gen);
    if (label) qs.set('label', label);
    return `${URL}/api/share/composite?${qs.toString()}`;
  })();

  const miniappEmbed = {
    version: '1',
    imageUrl,
    button: {
      title: `Reimagine Yours ->`,
      action: {
        type: 'launch_miniapp',
        name: appName,
        url: URL,
        splashImageUrl,
        splashBackgroundColor
      }
    }
  };

  return {
    title: appName,
    description: 'Reimagine your photos to art.',
    other: {
      'fc:miniapp': JSON.stringify(miniappEmbed),
      'fc:frame': JSON.stringify({
        version: '1',
        imageUrl,
        button: {
          title: `Reimagine Yours ->`,
          action: {
            type: 'launch_frame',
            name: appName,
            url: URL,
            splashImageUrl,
            splashBackgroundColor
          }
        }
      })
    }
  };
}

export default function SharePage({ params }: PageProps) {
  // Very lightweight page; embeds read the meta tags
  return (
    <main className="min-h-screen flex items-center justify-center p-8 text-center">
      <div>
        <h1 className="text-2xl font-black uppercase">Opening Snapdraft…</h1>
        <p className="mt-2 text-sm">If nothing happens, open the app manually.</p>
      </div>
    </main>
  );
}
