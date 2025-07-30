import { type NextRequest, NextResponse } from 'next/server';
import { fal } from '@fal-ai/client';
import { randomUUID } from 'crypto';

fal.config({
  credentials: process.env.FAL_API_KEY
});

// In-memory progress store (for dev/demo only)
const progressStore: Record<string, number> = {};

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, style } = await request.json();
    const requestId = randomUUID();
    let latestProgress = 0;

    // Use Fal AI to upscale the styled image
    const result = await fal.subscribe('fal-ai/clarity-upscaler', {
      input: {
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

    console.log('Fal AI result:', JSON.stringify(result, null, 2));
    // Fal AI returns a result object with .data.images[0].url
    const styledImageUrl = result?.data?.image.url;
    if (!styledImageUrl) {
      throw new Error('Fal AI did not return an image URL');
    }
    // Mark as complete
    progressStore[requestId] = 100;

    return NextResponse.json({
      success: true,
      styledImageUrl,
      requestId
    });
  } catch (error) {
    console.error('Image generation failed:', error);
    return NextResponse.json({ success: false, error: 'Image generation failed' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const progress = id && progressStore[id] ? progressStore[id] : 0;
  return NextResponse.json({ progress });
}
