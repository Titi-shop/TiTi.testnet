import BannerCarousel from "../components/BannerCarousel";

export const metadata = {
  title: "Quảng cáo & Khuyến mãi | TiTi Mall",
};

export default function AdsPage() {
  return (
    <main className="p-4 space-y-6 bg-gray-50 min-h-screen">
      <h1 className="text-xl font-semibold text-center text-red-600">
        🎉 Ưu đãi đặc biệt hôm nay 🎉
      </h1>

      {/* 🧩 Hiển thị banner quảng cáo */}
      <BannerCarousel />

      {/* 🏷️ Danh sách chương trình nổi bật */}
      <section className="mt-6 space-y-3">
        <h2 className="text-lg font-semibold text-gray-800 text-center">
          🔥 Chương trình nổi bật
        </h2>
        <ul className="space-y-2 text-sm text-gray-700 text-center">
          <li>🎁 Mua 1 tặng 1 – Áp dụng đến 10/11</li>
          <li>🚚 Miễn phí vận chuyển toàn quốc</li>
          <li>💰 Hoàn 5% Pi cho đơn từ 0.05 Pi</li>
        </ul>
      </section>
    </main>
  );
}
