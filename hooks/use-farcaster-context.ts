import { useMemo } from 'react';
import { useMiniKit } from '@coinbase/onchainkit/minikit';

export type FarcasterDerivedContext = {
  fid: number | null;
  username: string | null;
  displayName: string | null;
  pfpUrl: string | null;
  isInMiniApp: boolean;
  // Raw MiniKit context for advanced use-cases
  context: unknown;
};

export function useFarcasterContext(): FarcasterDerivedContext {
  const { context } = useMiniKit();

  return useMemo(() => {
    const userObj = (context as any)?.user ?? null;
    const clientObj = (context as any)?.client ?? null;

    const fid: number | null =
      (userObj && (userObj as any).fid) ??
      (clientObj && ((clientObj as any).fid ?? (clientObj as any).clientFid)) ??
      null;

    const username: string | null =
      (userObj && (userObj as any).username) ?? (clientObj && (clientObj as any).username) ?? null;

    const displayName: string | null =
      (userObj && (userObj as any).displayName) ??
      (clientObj && (clientObj as any).displayName) ??
      null;

    const pfpUrl: string | null =
      (userObj && ((userObj as any).pfpUrl ?? (userObj as any).pfp)) ??
      (clientObj && ((clientObj as any).pfpUrl ?? (clientObj as any).pfp)) ??
      null;

    const farcasterInjected = typeof window !== 'undefined' && !!(window as any)?.farcaster;

    const isInMiniApp = !!(userObj || clientObj) || farcasterInjected;

    return {
      fid,
      username,
      displayName,
      pfpUrl,
      isInMiniApp,
      context
    } as FarcasterDerivedContext;
  }, [context]);
}
