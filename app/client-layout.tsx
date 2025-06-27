'use client';
import PrivyProviderWrapper from '../components/privy-provider';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return <PrivyProviderWrapper>{children}</PrivyProviderWrapper>;
}
