import { type NextRequest, NextResponse } from 'next/server';
import { fal } from '@fal-ai/client';

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

function getStylePrompt(style: string): string {
  const prompts = {
    ghibli: 'in the style of Studio Ghibli, hand-drawn animation, dreamy, soft colors',
    anime: 'in anime style, vibrant colors, clean lines, Japanese animation',
    cyberpunk: 'cyberpunk style, neon lights, futuristic, dark atmosphere',
    watercolor: 'watercolor painting style, soft brushstrokes, artistic, flowing colors',
    neobrutalism:
      'neobrutalist design, bold geometric shapes, high contrast, raw concrete textures',
    'material-design':
      'Material Design 3 style, clean modern interface, dynamic colors, depth and shadows',
    minimalist:
      'minimalist design, clean simple lines, lots of white space, essential elements only',
    'art-deco': 'Art Deco style, geometric patterns, luxury gold accents, symmetrical design',
    vaporwave: 'vaporwave aesthetic, retro-futuristic, pink and cyan colors, grid patterns',
    sketch: 'pencil sketch style, hand-drawn lines, artistic shading, black and white',
    'oil-painting': 'oil painting style, rich textured brushstrokes, classical painting techniques',
    'pixel-art': 'pixel art style, 8-bit retro gaming, blocky pixels, limited color palette'
  };

  return prompts[style as keyof typeof prompts] || prompts.anime;
}
