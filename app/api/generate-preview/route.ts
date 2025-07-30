import { fal } from '@fal-ai/client';
import { type NextRequest, NextResponse } from 'next/server';
import { styles } from '@/lib/styles';
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

    const prompt = styles.find((s) => s.id === style)?.prompt || styles[0].prompt;

    const result = await fal.subscribe('fal-ai/flux-pro/kontext', {
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
              console.log('Parsed preview progress:', percent);
              latestProgress = percent;
              previewProgressStore[requestId] = latestProgress;
            }
          }
        }
      }
    });

    console.log('Fal AI result:', JSON.stringify(result, null, 2));

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
