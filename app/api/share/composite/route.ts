import { NextRequest } from 'next/server';

export const revalidate = 86400;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orig = searchParams.get('orig');
  const gen = searchParams.get('gen');
  const label = searchParams.get('label') || '';
  if (!gen) {
    return new Response('Missing gen', { status: 400 });
  }
  try {
    const fetchOpts: RequestInit & { next?: { revalidate?: number } } = {
      cache: 'force-cache',
      next: { revalidate: 86400 }
    };
    const [oBuf, gBuf] = await Promise.all([
      orig
        ? fetch(orig, fetchOpts)
            .then((r) => r.arrayBuffer())
            .then((b) => Buffer.from(b))
        : null,
      fetch(gen, fetchOpts)
        .then((r) => r.arrayBuffer())
        .then((b) => Buffer.from(b))
    ]);
    const sharp = (await import('sharp')).default;
    const jpegOpts = {
      quality: 82,
      progressive: true,
      mozjpeg: true,
      chromaSubsampling: '4:2:0' as const
    };
    const gImg = sharp(gBuf!).jpeg();
    // Produce a strict 3:2 aspect ratio (e.g., 1200x800)
    const height = 800;
    const width = 1200;
    // If no original provided, output the generated image alone (no split)
    if (!oBuf) {
      const single = await gImg.resize({ height, width, fit: 'cover' }).jpeg(jpegOpts).toBuffer();
      return new Response(single, {
        status: 200,
        headers: {
          'Content-Type': 'image/jpeg',
          'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
          'CDN-Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
          'Content-Length': String(single.length)
        }
      });
    }

    const oImg = sharp(oBuf).jpeg();
    const half = Math.floor(width / 2);
    const left = await oImg.resize({ height, width: half, fit: 'cover' }).toBuffer();
    const right = await gImg.resize({ height, width: half, fit: 'cover' }).toBuffer();

    const divider = Buffer.from(
      await sharp({
        create: { width: 4, height, channels: 3, background: { r: 0, g: 0, b: 0 } }
      })
        .jpeg()
        .toBuffer()
    );

    const base = sharp({
      create: { width, height, channels: 3, background: { r: 255, g: 255, b: 255 } }
    });

    let composite = await base
      .composite([
        { input: left, left: 0, top: 0 },
        { input: divider, left: half - 2, top: 0 },
        { input: right, left: half + 2, top: 0 }
      ])
      .jpeg(jpegOpts)
      .toBuffer();

    if (label) {
      // Optional: overlay style label bar
      const barH = 60;
      const bar = await sharp({
        create: { width, height: barH, channels: 3, background: { r: 253, g: 224, b: 71 } }
      })
        .jpeg()
        .toBuffer();
      // sharp doesn't do text without extra deps; skip textual overlay to keep it simple
      composite = await sharp(composite)
        .composite([{ input: bar, left: 0, top: 0 }])
        .jpeg(jpegOpts)
        .toBuffer();
    }

    const res = new Response(composite, {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
        'CDN-Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
        'Content-Length': String(composite.length)
      }
    });
    return res;
  } catch (e) {
    return new Response('Failed to compose', { status: 500 });
  }
}
