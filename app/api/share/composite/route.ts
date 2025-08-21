import { NextRequest } from 'next/server';

export const revalidate = 300;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orig = searchParams.get('orig');
  const gen = searchParams.get('gen');
  const label = searchParams.get('label') || '';
  if (!orig || !gen) {
    return new Response('Missing orig/gen', { status: 400 });
  }
  try {
    const [oRes, gRes] = await Promise.all([
      fetch(orig, { cache: 'no-store' }).then((r) => r.arrayBuffer()),
      fetch(gen, { cache: 'no-store' }).then((r) => r.arrayBuffer())
    ]);
    const oBuf = Buffer.from(oRes);
    const gBuf = Buffer.from(gRes);
    const sharp = (await import('sharp')).default;
    const oImg = sharp(oBuf).jpeg();
    const gImg = sharp(gBuf).jpeg();
    // Produce a strict 3:2 aspect ratio (e.g., 1200x800)
    const height = 800;
    const width = 1200;
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
      .jpeg({ quality: 85 })
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
        .jpeg({ quality: 85 })
        .toBuffer();
    }

    console.log('composite', composite);
    const res = new Response(composite, {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
      }
    });
    return res;
  } catch (e) {
    return new Response('Failed to compose', { status: 500 });
  }
}
