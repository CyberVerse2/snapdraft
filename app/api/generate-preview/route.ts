import { fal } from '@fal-ai/client';
import { type NextRequest, NextResponse } from 'next/server';
fal.config({
  credentials: process.env.FAL_API_KEY
});
export async function POST(request: NextRequest) {
  try {
    const { imageUrl, style } = await request.json();

    const result = await fal.subscribe('fal-ai/flux-pro/kontext', {
      input: {
        prompt:
          'Convert this image to the style of Minecraft. Render all subjects and backgrounds using blocky, pixelated shapes with sharp edges and low-resolution textures. Transform people, objects, and scenery into simplified, cube-like forms, just like Minecraft characters and environments. Use bright, flat colors. The overall scene should look like it was built from Minecraft blocks, with a playful, 3D voxel appearance.',
        guidance_scale: 3.5,
        num_images: 1,
        output_format: 'jpeg',
        safety_tolerance: '2',
        image_url: imageUrl
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === 'IN_PROGRESS') {
          update.logs.map((log) => log.message).forEach(console.log);
        }
      }
    });
    console.log(result.data);
    console.log(result.requestId);

    // For demo purposes, return a placeholder
    return NextResponse.json({
      success: true,
      previewImageUrl: result.data.images[0].url
    });
  } catch (error) {
    console.error('Preview generation failed:', error);
    return NextResponse.json(
      { success: false, error: 'Preview generation failed' },
      { status: 500 }
    );
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
