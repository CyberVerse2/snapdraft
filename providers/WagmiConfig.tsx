'use client';
import { ReactNode } from 'react';
import { WagmiConfig, createConfig, http } from 'wagmi';
import { base } from 'wagmi/chains';
import { farcasterMiniApp as miniAppConnector } from '@farcaster/miniapp-wagmi-connector';

export const wagmiConfig = createConfig({
  chains: [base],
  transports: {
    [base.id]: http()
  },
  connectors: [miniAppConnector()]
});

export function WagmiProvider({ children }: { children: ReactNode }) {
  return <WagmiConfig config={wagmiConfig}>{children}</WagmiConfig>;
}
