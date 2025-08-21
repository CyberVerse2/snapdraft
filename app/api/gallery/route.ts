import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fid = searchParams.get('fid');
    const where: any = { paid: true };
    if (fid) {
      where.creator = { fid: Number(fid) };
    }
    const images = await prisma.image.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { creator: true }
    });
    // originalUrl is already part of the model; it will be serialized automatically
    const res = NextResponse.json({ success: true, images });
    res.headers.set('Cache-Control', 'public, s-maxage=15, stale-while-revalidate=60');
    return res;
  } catch (error) {
    console.error('Gallery fetch failed:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch gallery' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { url, style, creatorFid, setFeatured, paid } = await request.json();
    console.log('[Gallery][POST] incoming', { url: !!url, style, creatorFid, setFeatured, paid });
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

    // Upsert-like behavior keyed by url:
    const existing = await prisma.image.findFirst({ where: { url } });
    let image;
    if (existing) {
      image = await prisma.image.update({
        where: { id: existing.id },
        data: {
          style: style ?? existing.style,
          // Only ever flip paid from false->true, not true->false
          paid: existing.paid || !!paid,
          isFeatured: !!setFeatured,
          creatorId: creator ? creator.id : existing.creatorId
        }
      });
    } else {
      image = await prisma.image.create({
        data: {
          url,
          style: style ?? 'unknown',
          paid: !!paid,
          isFeatured: !!setFeatured,
          creatorId: creator ? creator.id : undefined
        }
      });
    }
    console.log('[Gallery][POST] saved', {
      id: image.id,
      paid: image.paid,
      isFeatured: image.isFeatured
    });
    return NextResponse.json({ success: true, image });
  } catch (error) {
    console.error('[Gallery][POST] create failed:', error);
    return NextResponse.json({ success: false, error: 'Failed to add image' }, { status: 500 });
  }
}
