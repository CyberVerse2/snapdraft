import type { Metadata } from 'next';
import React from 'react';

type PageProps = {
  params: { id: string };
  searchParams: Record<string, string | string[] | undefined>;
};

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const URL = process.env.NEXT_PUBLIC_URL || '';
  const appName = process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME || 'Snapdraft';
  const splashImageUrl = `${URL}/icon.jpg`;
  const splashBackgroundColor = '#000000';

  // Try to derive an image URL from the path param if it looks like an encoded URL
  let decoded = '';
  try {
    decoded = decodeURIComponent(params.id || '');
  } catch {}
  const looksLikeUrl = /^https?:\/\//i.test(decoded);
  const imageUrl = looksLikeUrl ? decoded : `${URL}/og.jpg`;

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
          title: `Open ${appName}`,
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
