/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true
  },
  typescript: {
    ignoreBuildErrors: true
  },
  images: {
    unoptimized: true
  },
  webpack: (config) => {
    // Alias deprecated @farcaster/frame-sdk to @farcaster/miniapp-sdk to silence deprecation
    config.resolve = config.resolve || {};
    config.resolve.alias = config.resolve.alias || {};
    config.resolve.alias['@farcaster/frame-sdk'] = '@farcaster/miniapp-sdk';
    return config;
  }
};

export default nextConfig;
