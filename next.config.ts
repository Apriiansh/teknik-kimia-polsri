import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  compiler: {
    removeConsole: { exclude: ["error", "warn"] }
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'psnwscikbfrralawhvol.supabase.co',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '3mb',
    }
  },
};

export default nextConfig;
