import { paymentMiddleware } from 'x402-next';

// Coinbase x402 Paywall Middleware
// Protects the /api/generate-image endpoint with a $0.50 paywall (Base network)
export const middleware = paymentMiddleware(
  '0xd09e70C83185E9b5A2Abd365146b58Ef0ebb8B7B', // CDP Wallet address
  {
    '/api/generate-image': {
      price: '$0.50',
      network: 'base',
      config: {
        description: 'Full-quality AI image generation'
      }
    }
  }
);

export const config = {
  matcher: ['/api/generate-image']
};
