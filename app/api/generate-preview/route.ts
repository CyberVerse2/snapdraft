import { fal } from '@fal-ai/client';
import { type NextRequest, NextResponse } from 'next/server';
import { getStylePrompt } from '@/lib/style-prompts';
import { randomUUID } from 'crypto';

const previewProgressStore: Record<string, number> = {};

fal.config({
  credentials: process.env.FAL_API_KEY
});
export async function POST(request: NextRequest) {
  try {
    const { imageUrl, style } = await request.json();
    const requestId = randomUUID();
    let latestProgress = 0;

    const result = await fal.subscribe('fal-ai/flux-pro/kontext', {
      input: {
        prompt: getStylePrompt(style),
        guidance_scale: 3.5,
        num_images: 1,
        output_format: 'jpeg',
        safety_tolerance: '2',
        image_url: imageUrl
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === 'IN_PROGRESS' && update.logs) {
          for (const log of update.logs) {
            const match = log.message.match(/(\d+)%\|/);
            if (match) {
              latestProgress = parseInt(match[1], 10);
              previewProgressStore[requestId] = latestProgress;
            }
          }
        }
      }
    });

    const previewImageUrl = result.data.images[0].url;
    previewProgressStore[requestId] = 100;
    return NextResponse.json({
      success: true,
      previewImageUrl,
      requestId
    });
  } catch (error) {
    console.error('Preview generation failed:', error);
    return NextResponse.json(
      { success: false, error: 'Preview generation failed' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const progress = id && previewProgressStore[id] ? previewProgressStore[id] : 0;
  return NextResponse.json({ progress });
}
