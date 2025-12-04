/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  images: { unoptimized: true },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self';",
              "script-src 'self' https://sdk.minepi.com 'unsafe-inline' 'unsafe-eval';",
              "connect-src 'self' https://api.minepi.com https://sdk.minepi.com https://minepi.com;",
              "img-src 'self' data: blob: https:;",
              "style-src 'self' 'unsafe-inline';",
              "frame-src 'self' https://sdk.minepi.com https://minepi.com;",
            ].join(" "),
          },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "ALLOWALL" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },

  experimental: {
    serverActions: false,
  },
};

export default nextConfig;
