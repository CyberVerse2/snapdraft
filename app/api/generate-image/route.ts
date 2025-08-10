import { type NextRequest, NextResponse } from 'next/server';
import { fal } from '@fal-ai/client';
import { randomUUID } from 'crypto';
import { styles } from '@/lib/styles';
import { prisma } from '@/lib/prisma';

fal.config({
  credentials: process.env.FAL_API_KEY
});

// In-memory progress store (for dev/demo only)
const progressStore: Record<string, number> = {};

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
    let latestProgress = 0;

    // Align generation logic with preview route
    let result;
    const prompt = styles.find((s) => s.id === style)?.prompt || styles[0].prompt;
    if (style === 'anime' || style === 'ghibli') {
      result = await fal.subscribe('fal-ai/flux-kontext-lora', {
        input: {
          prompt,
          guidance_scale: 3.5,
          num_images: 1,
          output_format: 'jpeg',
          image_url: imageUrl
        },
        logs: true,
        onQueueUpdate: (update) => {
          console.log('Fal AI update:', JSON.stringify(update, null, 2));
          if (update.status === 'IN_PROGRESS' && update.logs) {
            for (const log of update.logs) {
              console.log('Fal AI log:', log.message);
              const match = log.message.match(/(\d+)%\|/);
              if (match) {
                const percent = parseInt(match[1], 10);
                console.log('Parsed progress:', percent);
                latestProgress = percent;
                progressStore[requestId] = latestProgress;
              }
            }
          }
        }
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
        logs: true,
        onQueueUpdate: (update) => {
          console.log('Fal AI update:', JSON.stringify(update, null, 2));
          if (update.status === 'IN_PROGRESS' && update.logs) {
            for (const log of update.logs) {
              console.log('Fal AI log:', log.message);
              const match = log.message.match(/(\d+)%\|/);
              if (match) {
                const percent = parseInt(match[1], 10);
                console.log('Parsed progress:', percent);
                latestProgress = percent;
                progressStore[requestId] = latestProgress;
              }
            }
          }
        }
      });
    }

    console.log('Fal AI result:', JSON.stringify(result, null, 2));
    // Fal AI returns a result object with .data.images[0].url or .data.image.url
    const styledImageUrl = result?.data?.images?.[0]?.url as string | undefined;
    if (!styledImageUrl) {
      return NextResponse.json(
        { success: false, error: 'Image provider did not return an image URL' },
        { status: 502 }
      );
    }
    // Mark as complete
    progressStore[requestId] = 100;

    // Persist image and set as featured
    try {
      await prisma.image.updateMany({ data: { isFeatured: false }, where: { isFeatured: true } });
      // Upsert creator if provided (guard non-numeric fids)
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

    return NextResponse.json({
      success: true,
      styledImageUrl,
      requestId
    });
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
  return NextResponse.json({ progress });
}
