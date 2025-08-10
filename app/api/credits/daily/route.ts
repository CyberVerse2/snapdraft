import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { fid } = await request.json();
    if (!fid) return NextResponse.json({ success: false, error: 'Missing fid' }, { status: 400 });

    const user = await prisma.user.upsert({
      where: { fid },
      update: {},
      create: { fid }
    });

    // Determine if already claimed today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const claimed = await prisma.creditEvent.findFirst({
      where: { userId: user.id, reason: 'daily_login', createdAt: { gte: startOfToday } }
    });
    if (claimed) {
      return NextResponse.json({ success: true, alreadyClaimed: true });
    }

    // Award 1 credit
    const delta = 1;
    await prisma.$transaction([
      prisma.creditEvent.create({
        data: { userId: user.id, delta, reason: 'daily_login' }
      }),
      prisma.creditBalance.upsert({
        where: { userId: user.id },
        create: { userId: user.id, credits: delta },
        update: { credits: { increment: delta } }
      })
    ]);

    return NextResponse.json({ success: true, awarded: delta });
  } catch (error) {
    console.error('Daily credit grant failed:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to grant daily credit' },
      { status: 500 }
    );
  }
}
