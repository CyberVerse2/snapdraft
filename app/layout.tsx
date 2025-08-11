import type React from 'react';
import { Metadata } from 'next';
import { Inter, League_Spartan } from 'next/font/google';
import './globals.css';
import { MiniKitContextProvider } from '@/providers/MiniKitProvider';
import { WagmiProvider } from '@/providers/WagmiConfig';

export async function generateMetadata(): Promise<Metadata> {
  const URL = process.env.NEXT_PUBLIC_URL;
  const appName = process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME;
  const imageUrl = `${URL}/og.jpg`;
  const splashImageUrl = `${URL}/icon.jpg`;
  const splashBackgroundColor = '#000000';

  // Build Mini App embed per latest docs
  const miniappEmbed = {
    version: '1',
    imageUrl,
    button: {
      title: `Launch ${appName}`,
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
      // New embed tag
      'fc:miniapp': JSON.stringify(miniappEmbed),
      // Backward compatibility tag
      'fc:frame': JSON.stringify({
        version: '1',
        imageUrl,
        button: {
          title: `Launch ${appName}`,
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

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-inter',
  display: 'swap'
});

const spartan = League_Spartan({
  subsets: ['latin'],
  weight: ['700', '800', '900'],
  variable: '--font-spartan',
  display: 'swap'
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${spartan.variable}`}>
      <body className="font-sans">
        <WagmiProvider>
          <MiniKitContextProvider>{children}</MiniKitContextProvider>
        </WagmiProvider>
      </body>
    </html>
  );
}
