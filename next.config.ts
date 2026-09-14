import type { NextConfig } from "next";

/**
 * Canonical production host. The www subdomain is 301-redirected here so
 * search engines only ever index one host (prevents duplicate-host content).
 */
const PROD_HOST = "briefy.live";

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      // IndexNow requires the key file at https://<host>/{KEY}.txt —
      // rewrite any /<something>.txt to the key handler, which validates
      // the requested key against INDEXNOW_KEY. beforeFiles runs before
      // filesystem routes, and public/ contains no .txt files, so this is
      // unambiguous.
      beforeFiles: [
        {
          source: '/:key*.txt',
          destination: '/api/indexnow-key?key=:key*.txt',
        },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: `www.${PROD_HOST}` }],
        destination: `https://${PROD_HOST}/:path*`,
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
  images: {
    // Allowlist only the image hosts the newsroom actually uses.
    // Previously `hostname: "**"` let any origin be proxied through the
    // deployment's image optimizer (abuse vector) and allowed http://
    // (mixed-content risk).
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "plus.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "**.cdn.ampproject.org",
      },
    ],
  },
};

export default nextConfig;
