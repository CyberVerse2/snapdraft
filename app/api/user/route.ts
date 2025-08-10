import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { fid, username, displayName, pfpUrl, walletAddress } = await request.json();
    if (!fid) return NextResponse.json({ success: false, error: 'Missing fid' }, { status: 400 });
    const user = await prisma.user.upsert({
      where: { fid: Number(fid) },
      update: { username, displayName, pfpUrl, walletAddress },
      create: { fid: Number(fid), username, displayName, pfpUrl, walletAddress }
    });
    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('User upsert failed:', error);
    return NextResponse.json({ success: false, error: 'Failed to upsert user' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fid = searchParams.get('fid');
    if (!fid) return NextResponse.json({ success: false, error: 'Missing fid' }, { status: 400 });
    const user = await prisma.user.findFirst({ where: { fid: Number(fid) } });
    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('User fetch failed:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch user' }, { status: 500 });
  }
}
