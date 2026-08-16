import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['better-sqlite3'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/pilih-outlet',
        destination: '/order/kopi-kenangan/menu',
        permanent: true,
      },
      {
        source: '/menu',
        destination: '/order/kopi-kenangan/menu',
        permanent: true,
      },
      {
        source: '/checkout',
        destination: '/order/kopi-kenangan/checkout',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
