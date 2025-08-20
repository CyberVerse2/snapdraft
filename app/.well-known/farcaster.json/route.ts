import { NextRequest, NextResponse } from 'next/server';

export async function GET(_req: NextRequest) {
  const manifest = {
    frame: {
      name: 'Snap',
      homeUrl: 'https://snapdraft-murex.vercel.app',
      iconUrl: 'https://snapdraft-murex.vercel.app/icon.jpg',
      ogTitle: 'Snap - Turn Your Photos To Art',
      tagline: 'Turn your photos into art',
      version: '1',
      imageUrl: 'https://snapdraft-murex.vercel.app/og.jpg',
      subtitle: 'Reimagine your photos into art',
      ogImageUrl: 'https://snapdraft-murex.vercel.app/og.jpg',
      webhookUrl: 'https://snapdraft-murex.vercel.app/api/webhook',
      buttonTitle: 'Reimagine your photo',
      description: 'Turn your photos into works of art',
      heroImageUrl: 'https://snapdraft-murex.vercel.app/og.jpg',
      splashImageUrl: 'https://snapdraft-murex.vercel.app/icon.jpg',
      primaryCategory: 'art-creativity',
      splashBackgroundColor: '#FEF3C7'
    },
    accountAssociation: {
      header:
        'eyJmaWQiOjY1NjU4OCwidHlwZSI6ImF1dGgiLCJrZXkiOiIweDZhNDYxZTlDNTY2Q2UwYmUzZUFEYjY0RkREQjEzMzNBZjcwMWExZkQifQ',
      payload: 'eyJkb21haW4iOiJzbmFwZHJhZnQtbXVyZXgudmVyY2VsLmFwcCJ9',
      signature:
        'AX1dEtGoGCzVxaVt9Gk2maSb4dJOcVSBmurHRj8BbI5m4kDrbOcw/3DL2mZ/f/w80AqI2931Pp/oYF6Cl+1+GBs='
    },
    baseBuilder: {
      allowedAddresses: ['0x8Fb7D89A66bdeEa9a26Fb7c3Ae98DE39a0847b5D']
    }
  } as const;

  return NextResponse.json(manifest);
}
