import { type NextRequest, NextResponse } from 'next/server';
import { fal } from '@fal-ai/client';
import { randomUUID } from 'crypto';
import { styles } from '@/lib/styles';
import { prisma } from '@/lib/prisma';

fal.config({
  credentials: process.env.FAL_API_KEY
});

// In-memory stores (for dev/demo only)
const progressStore: Record<string, number> = {};
const resultStore: Record<string, string> = {};

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, style, fid } = await request.json();
    if (!imageUrl || typeof imageUrl !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid or missing imageUrl' },
        { status: 400 }
      );
    }
    if (!process.env.FAL_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'Server misconfigured: missing FAL_API_KEY' },
        { status: 500 }
      );
    }
    const requestId = randomUUID();
    progressStore[requestId] = 0;

    // Start generation in background; respond immediately with requestId
    (async () => {
      try {
        const prompt = styles.find((s) => s.id === style)?.prompt || styles[0].prompt;
        let latestProgress = 0;
        let result: any;
        const common = {
          logs: true,
          onQueueUpdate: (update: any) => {
            try {
              if (update.status === 'IN_PROGRESS' && update.logs) {
                for (const log of update.logs) {
                  const match = (log.message as string).match(/(\d+)%\|/);
                  if (match) {
                    latestProgress = parseInt(match[1], 10);
                    progressStore[requestId] = latestProgress;
                  }
                }
              }
            } catch {}
          }
        } as const;
        if (style === 'anime' || style === 'ghibli') {
          result = await fal.subscribe('fal-ai/flux-kontext-lora', {
            input: {
              prompt,
              guidance_scale: 3.5,
              num_images: 1,
              output_format: 'jpeg',
              image_url: imageUrl
            },
            ...common
          });
        } else {
          result = await fal.subscribe('fal-ai/flux-pro/kontext', {
            input: {
              prompt,
              guidance_scale: 3.5,
              num_images: 1,
              output_format: 'jpeg',
              safety_tolerance: '2',
              image_url: imageUrl
            },
            ...common
          });
        }
        const styledImageUrl = result?.data?.images?.[0]?.url as string | undefined;
        if (styledImageUrl) {
          progressStore[requestId] = 100;
          resultStore[requestId] = styledImageUrl;
          // Persist image and set as featured
          try {
            await prisma.image.updateMany({
              data: { isFeatured: false },
              where: { isFeatured: true }
            });
            const numericFid = typeof fid === 'number' ? fid : Number(fid);
            const creator = Number.isFinite(numericFid)
              ? await prisma.user.upsert({
                  where: { fid: numericFid },
                  update: {},
                  create: { fid: numericFid }
                })
              : null;
            await prisma.image.create({
              data: {
                url: styledImageUrl,
                style: style ?? 'unknown',
                isFeatured: true,
                creatorId: creator ? creator.id : undefined
              }
            });
          } catch (e) {
            console.error('Failed to persist image:', e);
          }
        }
      } catch (e) {
        console.error('Background generation failed:', e);
      }
    })();

    return NextResponse.json({ success: true, requestId }, { status: 202 });
  } catch (error: any) {
    console.error('Image generation failed:', error);
    const message = typeof error?.message === 'string' ? error.message : 'Image generation failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const progress = id && progressStore[id] ? progressStore[id] : 0;
  const styledImageUrl = id ? resultStore[id] || null : null;
  return NextResponse.json({ progress, styledImageUrl });
}
