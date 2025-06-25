import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, style } = await request.json()

    // Simulate preview generation (faster, lower quality)
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // In a real implementation, you would use Fal AI with lower quality settings
    // const fal = require('@fal-ai/serverless')
    //
    // const result = await fal.subscribe('fal-ai/fast-sdxl', {
    //   input: {
    //     image_url: imageUrl,
    //     prompt: getStylePrompt(style),
    //     strength: 0.6, // Lower strength for preview
    //     num_inference_steps: 15, // Fewer steps for speed
    //     guidance_scale: 7.5,
    //     image_size: "square_hd" // Lower resolution for preview
    //   }
    // })

    // For demo purposes, return a placeholder
    return NextResponse.json({
      success: true,
      previewImageUrl: `/placeholder.svg?height=400&width=400&text=${style}-preview`,
    })
  } catch (error) {
    console.error("Preview generation failed:", error)
    return NextResponse.json({ success: false, error: "Preview generation failed" }, { status: 500 })
  }
}

function getStylePrompt(style: string): string {
  const prompts = {
    ghibli: "in the style of Studio Ghibli, hand-drawn animation, dreamy, soft colors",
    anime: "in anime style, vibrant colors, clean lines, Japanese animation",
    cyberpunk: "cyberpunk style, neon lights, futuristic, dark atmosphere",
    watercolor: "watercolor painting style, soft brushstrokes, artistic, flowing colors",
    neobrutalism: "neobrutalist design, bold geometric shapes, high contrast, raw concrete textures",
    "material-design": "Material Design 3 style, clean modern interface, dynamic colors, depth and shadows",
    minimalist: "minimalist design, clean simple lines, lots of white space, essential elements only",
    "art-deco": "Art Deco style, geometric patterns, luxury gold accents, symmetrical design",
    vaporwave: "vaporwave aesthetic, retro-futuristic, pink and cyan colors, grid patterns",
    sketch: "pencil sketch style, hand-drawn lines, artistic shading, black and white",
    "oil-painting": "oil painting style, rich textured brushstrokes, classical painting techniques",
    "pixel-art": "pixel art style, 8-bit retro gaming, blocky pixels, limited color palette",
  }

  return prompts[style as keyof typeof prompts] || prompts.anime
}
