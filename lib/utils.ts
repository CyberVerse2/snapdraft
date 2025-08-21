import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Unified share URL builder: /share/<encodedGen>?orig=<encodedOrig>&label=<LABEL>
export function buildShareUrl(baseUrl: string, genUrl: string, origUrl?: string, label?: string) {
  const qs = new URLSearchParams();
  if (origUrl) qs.set('orig', origUrl);
  if (label) qs.set('label', label);
  const suffix = qs.toString();
  return `${baseUrl}/share/${encodeURIComponent(genUrl)}${suffix ? `?${suffix}` : ''}`;
}
