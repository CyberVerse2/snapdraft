import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Unified share URL builder: /share/<encodedGen>?orig=<encodedOrig>&label=<LABEL>
export function buildShareUrl(baseUrl: string, genUrl: string, origUrl?: string, label?: string) {
  const params: string[] = [];
  if (origUrl) params.push(`orig=${encodeURIComponent(origUrl)}`);
  if (label) params.push(`label=${encodeURIComponent(label)}`);
  return `${baseUrl}/share/${encodeURIComponent(genUrl)}${
    params.length ? `?${params.join('&')}` : ''
  }`;
}
