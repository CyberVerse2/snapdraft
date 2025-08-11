import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const featured = await prisma.image.findFirst({ where: { isFeatured: true }, orderBy: { createdAt: 'desc' }, include: { creator: true } });
    const res = NextResponse.json({ success: true, featured });
    res.headers.set('Cache-Control', 'public, s-maxage=15, stale-while-revalidate=60');
    return res;
  } catch (error) {
    console.error('Featured fetch failed:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch featured' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { imageId } = await request.json();
    if (!imageId) return NextResponse.json({ success: false, error: 'Missing imageId' }, { status: 400 });
    await prisma.image.updateMany({ data: { isFeatured: false }, where: { isFeatured: true } });
    const updated = await prisma.image.update({ where: { id: imageId }, data: { isFeatured: true } });
    return NextResponse.json({ success: true, featured: updated });
  } catch (error) {
    console.error('Featured set failed:', error);
    return NextResponse.json({ success: false, error: 'Failed to set featured' }, { status: 500 });
  }
}