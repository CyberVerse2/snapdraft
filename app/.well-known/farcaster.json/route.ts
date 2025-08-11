import { NextRequest, NextResponse } from 'next/server';

export async function GET(_req: NextRequest) {
  const target = process.env.NEXT_PUBLIC_FARCASTER_MANIFEST_URL;
  if (!target) {
    return NextResponse.json(
      { error: 'Missing NEXT_PUBLIC_FARCASTER_MANIFEST_URL' },
      { status: 500 }
    );
  }
  return NextResponse.redirect(target, { status: 307 });
}
