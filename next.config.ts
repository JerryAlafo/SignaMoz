import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* SEO & Performance Optimizations */
  
  // Image Optimization
  images: {
    formats: ["image/webp", "image/avif"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Security Headers
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
      // Cache images for 1 year
      {
        source: "/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },

  // Redirects for SEO
  async redirects() {
    return [
      // Add any URL redirects here
      {
        source: "/libras",
        destination: "/",
        permanent: false,
      },
    ];
  },

  // Rewrites for clean URLs
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [],
    };
  },

  // Compress output
  compress: true,

  // Enable React strict mode for development
  reactStrictMode: true,

  // Enable experimental features
  experimental: {
    optimizePackageImports: ["next"],
  },
};

export default nextConfig;
