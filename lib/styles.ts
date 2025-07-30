export interface StyleDefinition {
  id: string;
  name: string;
  description: string;
  color: string;
  category: 'artistic' | 'modern' | 'digital';
  popular: boolean;
  prompt: string;
}

export const styles: StyleDefinition[] = [
  {
    id: 'minecraft',
    name: 'MINECRAFT',
    description: 'BLOCKY PIXELS',
    color: 'bg-green-500',
    category: 'digital',
    popular: true,
    prompt:
      'minecraft style, blocky, pixelated shapes, cube-like forms, bright flat colors, voxel appearance'
  },
  {
    id: 'ghibli',
    name: 'GHIBLI',
    description: 'DREAMY ANIMATION',
    color: 'bg-green-400',
    category: 'artistic',
    popular: false,
    prompt:
      'Convert this image to the art style of a Studio Ghibli film. Render the subjects with soft, rounded facial features, gentle and expressive eyes, and detailed yet whimsical hair, using painterly textures and warm, vibrant colors. Apply delicate shading and subtle gradients, giving the scene a dreamy, magical atmosphere typical of Ghibli movies. The background should be lush and richly detailed, with an emphasis on nature and a sense of wonder, as seen in films like My Neighbor Totoro or Spirited Away. The overall image should evoke a heartfelt, storybook quality.'
  },
  {
    id: 'anime',
    name: 'ANIME',
    description: 'VIBRANT ANIMATION',
    color: 'bg-pink-400',
    category: 'artistic',
    popular: true,
    prompt:
      'Convert this image to the art style of the Naruto anime series. Render the subject with sharp, slightly angular faces, expressive and bold anime eyes, and stylized, spiky or chunky hair, outlined with strong, hand-drawn linework. Use dramatic cel-shaded shadows and an earthy, natural color palette. The background and overall scene should have the painterly, warm feel of Naruto’s Hidden Leaf Village settings. Add subtle ninja details or accessories if appropriate, such as ninja headbands, utility pouches, or symbols from the Naruto universe. The result should look like a frame from the Naruto anime, with iconic anime facial features and dynamic shading.'
  },
  {
    id: 'watercolor',
    name: 'WATERCOLOR',
    description: 'SOFT PAINTING',
    color: 'bg-blue-400',
    category: 'artistic',
    popular: false,
    prompt: 'watercolor painting style, soft brushstrokes, artistic, flowing colors'
  },
  {
    id: 'oil-painting',
    name: 'OIL PAINT',
    description: 'CLASSIC ART',
    color: 'bg-orange-400',
    category: 'artistic',
    popular: false,
    prompt: 'oil painting style, rich textured brushstrokes, classical painting techniques'
  },
  {
    id: 'sketch',
    name: 'SKETCH',
    description: 'PENCIL DRAWN',
    color: 'bg-gray-400',
    category: 'artistic',
    popular: false,
    prompt: 'pencil sketch style, hand-drawn lines, artistic shading, black and white'
  },

  {
    id: 'cyberpunk',
    name: 'CYBERPUNK',
    description: 'NEON FUTURE',
    color: 'bg-cyan-400',
    category: 'digital',
    popular: false,
    prompt: 'cyberpunk style, neon lights, futuristic, dark atmosphere'
  }
];
