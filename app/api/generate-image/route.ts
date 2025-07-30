import { type NextRequest, NextResponse } from 'next/server';
import { fal } from '@fal-ai/client';
import { getStylePrompt } from '@/lib/style-prompts';

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, style } = await request.json();

    // Use Fal AI to generate the styled image
    const result = await fal.subscribe('fal-ai/fast-sdxl', {
      input: {
        image_url: imageUrl,
        prompt: getStylePrompt(style),
        strength: 0.8,
        num_inference_steps: 25
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === 'IN_PROGRESS') {
          update.logs?.map((log) => log.message).forEach(console.log);
        }
      }
    });

    // Fal AI returns a result object with .data.images[0].url
    const styledImageUrl = result?.data?.images?.[0]?.url;
    if (!styledImageUrl) {
      throw new Error('Fal AI did not return an image URL');
    }

    return NextResponse.json({
      success: true,
      styledImageUrl
    });
  } catch (error) {
    console.error('Image generation failed:', error);
    return NextResponse.json({ success: false, error: 'Image generation failed' }, { status: 500 });
  }
}
