/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Proxy API calls to the backend server-side (avoids HTTPS→HTTP mixed-content
  // blocking in the browser; also makes API calls same-origin so CORS is moot).
  // Local dev is unaffected: NEXT_PUBLIC_API_URL=http://localhost:8000 bypasses this.
  async rewrites() {
    const backend = process.env.BACKEND_ORIGIN || "http://173.230.128.241:8000";
    return [{ source: "/api/:path*", destination: `${backend}/api/:path*` }];
  },

  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "geolocation=(self), camera=(self), microphone=()",
          },
        ],
      },
      // Allow service worker at root
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache" },
          { key: "Content-Type", value: "application/javascript" },
        ],
      },
    ];
  },

  // Allow images from MinIO / external
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost", port: "9000" },
      { protocol: "https", hostname: "**.maptiler.com" },
      { protocol: "https", hostname: "**.mapbox.com" },
    ],
  },

  // Environment variables exposed to the browser
  env: {
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || "St. Augustine TimeQuest",
  },
};

module.exports = nextConfig;
