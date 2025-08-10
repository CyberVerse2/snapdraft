import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fid = searchParams.get('fid');
    if (!fid) return NextResponse.json({ success: false, error: 'Missing fid' }, { status: 400 });
    const user = await prisma.user.findFirst({ where: { fid: Number(fid) } });
    return NextResponse.json({ success: true, frameAdded: !!user?.frameAdded });
  } catch (error) {
    console.error('Miniapp prompt status fetch failed:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch status' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { fid, frameAdded } = await request.json();
    if (!fid) return NextResponse.json({ success: false, error: 'Missing fid' }, { status: 400 });
    const user = await prisma.user.upsert({
      where: { fid: Number(fid) },
      update: { frameAdded: !!frameAdded },
      create: { fid: Number(fid), frameAdded: !!frameAdded }
    });
    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('Miniapp prompt status update failed:', error);
    return NextResponse.json({ success: false, error: 'Failed to update status' }, { status: 500 });
  }
}