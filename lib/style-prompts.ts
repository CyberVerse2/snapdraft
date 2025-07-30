export const stylePrompts = {
  ghibli: 'in the style of Studio Ghibli, hand-drawn animation, dreamy, soft colors',
  anime: 'in anime style, vibrant colors, clean lines, Japanese animation',
  cyberpunk: 'cyberpunk style, neon lights, futuristic, dark atmosphere',
  watercolor: 'watercolor painting style, soft brushstrokes, artistic, flowing colors',
  neobrutalism: 'neobrutalist design, bold geometric shapes, high contrast, raw concrete textures',
  'material-design':
    'Material Design 3 style, clean modern interface, dynamic colors, depth and shadows',
  minimalist: 'minimalist design, clean simple lines, lots of white space, essential elements only',
  'art-deco': 'Art Deco style, geometric patterns, luxury gold accents, symmetrical design',
  vaporwave: 'vaporwave aesthetic, retro-futuristic, pink and cyan colors, grid patterns',
  sketch: 'pencil sketch style, hand-drawn lines, artistic shading, black and white',
  'oil-painting': 'oil painting style, rich textured brushstrokes, classical painting techniques',
  'pixel-art': 'pixel art style, 8-bit retro gaming, blocky pixels, limited color palette',
  minecraft:
    'Convert this image to the style of Minecraft. Render all subjects and backgrounds using blocky, pixelated shapes with sharp edges and low-resolution textures. Transform people, objects, and scenery into simplified, cube-like forms, just like Minecraft characters and environments. Use bright, flat colors. The overall scene should look like it was built from Minecraft blocks, with a playful, 3D voxel appearance.'
};

export function getStylePrompt(style: string): string {
  return stylePrompts[style as keyof typeof stylePrompts] || stylePrompts.anime;
}
