'use client';
import { PrivyProvider } from '@privy-io/react-auth';

export default function PrivyProviderWrapper({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      config={{
        loginMethods: ['wallet']
        // externalWallets: ['metamask', 'coinbase_wallet', 'wallet_connect'], // Uncomment to restrict
      }}
    >
      {children}
    </PrivyProvider>
  );
}
