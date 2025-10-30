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
            value:
              "default-src 'self'; " +
              "script-src 'self' https://sdk.minepi.com 'unsafe-inline'; " +
              "connect-src 'self' https://api.minepi.com https://sdk.minepi.com; " +
              "img-src 'self' data: blob:; " +
              "style-src 'self' 'unsafe-inline'; " +
              "frame-src 'self';",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
