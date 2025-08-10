import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fid = searchParams.get('fid');
    const where = fid ? { creator: { fid: Number(fid) } } : {};
    const images = await prisma.image.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { creator: true }
    });
    return NextResponse.json({ success: true, images });
  } catch (error) {
    console.error('Gallery fetch failed:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch gallery' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { url, style, creatorFid, setFeatured } = await request.json();
    if (!url) return NextResponse.json({ success: false, error: 'Missing url' }, { status: 400 });

    // Optional: set featured atomically by unsetting previous featured first
    if (setFeatured) {
      await prisma.image.updateMany({ data: { isFeatured: false }, where: { isFeatured: true } });
    }

    const creator = creatorFid
      ? await prisma.user.upsert({
          where: { fid: Number(creatorFid) },
          update: {},
          create: { fid: Number(creatorFid) }
        })
      : null;

    const image = await prisma.image.create({
      data: {
        url,
        style: style ?? 'unknown',
        isFeatured: !!setFeatured,
        creatorId: creator ? creator.id : undefined
      }
    });

    return NextResponse.json({ success: true, image });
  } catch (error) {
    console.error('Gallery create failed:', error);
    return NextResponse.json({ success: false, error: 'Failed to add image' }, { status: 500 });
  }
}
