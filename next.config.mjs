/** @type {import('next').NextConfig} */
const nextConfig = {
  // ✅ Bỏ qua lỗi ESLint trong quá trình build
  eslint: {
    ignoreDuringBuilds: true,
  },

  // ✅ Bỏ qua lỗi TypeScript trong quá trình build
  typescript: {
    ignoreBuildErrors: true,
  },

  // ✅ Không tối ưu ảnh (giúp load nhanh hơn)
  images: {
    unoptimized: true,
  },

  // ✅ Cho phép tải script Pi SDK từ domain chính thức
  async headers() {
    return [
      {
        source: "/(.*)", // Áp dụng cho toàn bộ route
        headers: [
          {
            key: "Content-Security-Policy",
            // ⚙️ Cho phép script Pi SDK và inline script cần thiết
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
