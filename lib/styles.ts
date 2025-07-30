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
    prompt: 'in the style of Studio Ghibli, hand-drawn animation, dreamy, soft colors'
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
