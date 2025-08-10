export interface StyleDefinition {
  id: string;
  name: string;
  description: string;
  color: string;
  category: 'artistic' | 'modern' | 'digital';
  popular: boolean;
  thumbnail: string; // path under /public
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
    thumbnail: '/sample-hero.jpg',
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
    thumbnail: '/sample-hero.jpg',
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
    thumbnail: '/sample-hero.jpg',
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
    thumbnail: '/sample-hero.jpg',
    prompt:
      'Transform this image into a delicate watercolor and ink illustration. Use soft pastel tones, fluid washes of color, and loose, expressive brushwork. Outline subjects with fine, elegant pencil or ink strokes, blending realism with stylized exaggeration. Apply subtle gradients and splashes of color in the background to evoke a dreamy, romantic atmosphere. Emphasize glowing skin tones, luminous highlights, and hand-drawn texture across the composition.'
  },
  {
    id: 'oil-painting',
    name: 'OIL PAINT',
    description: 'CLASSIC ART',
    color: 'bg-orange-400',
    category: 'artistic',
    popular: false,
    thumbnail: '/sample-hero.jpg',
    prompt:
      'Transform this image into an expressive oil painting. Use visible, textured brushstrokes and a slightly impressionistic style. Render lighting with warm tones and painterly gradients. Apply rich, layered textures to mimic thick oil on canvas. Preserve the subject and composition while evoking the emotion and artistry of a hand-painted scene.'
  },
  {
    id: 'sketch',
    name: 'SKETCH',
    description: 'PENCIL DRAWN',
    color: 'bg-gray-400',
    category: 'artistic',
    popular: false,
    thumbnail: '/sample-hero.jpg',
    prompt:
      'Transform this image into a detailed pencil sketch. Use fine, clean graphite lines to outline forms with light shading and hatching for depth and texture. Focus on contours, proportions, and expression over color. The background should remain minimal or softly shaded to maintain a hand-drawn, studio sketchbook aesthetic. Emphasize the artistic, unfinished quality of an observational drawing.'
  }
];
