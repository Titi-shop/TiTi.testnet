import BannerCarousel from "app/components/BannerCarousel";

export const metadata = {
  title: "Quảng cáo & Khuyến mãi | TiTi Mall",
};

export default function AdsPage() {
  return (
    <main className="p-4 space-y-4 bg-gray-50 min-h-screen">
      <h1 className="text-xl font-semibold text-center text-red-600">
        🎉 Ưu đãi đặc biệt hôm nay 🎉
      </h1>

      <BannerCarousel />

      <section className="mt-6 space-y-3">
        <h2 className="text-lg font-semibold">Chương trình nổi bật</h2>
        <ul className="space-y-2 text-sm text-gray-700">
          <li>🔥 Mua 1 tặng 1 – Áp dụng đến 10/11</li>
          <li>🛍️ Miễn phí vận chuyển toàn quốc</li>
          <li>💰 Hoàn 5% Pi cho đơn từ 0.05 Pi</li>
        </ul>
      </section>
    </main>
  );
}
