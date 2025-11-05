"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BannerCarousel from "../components/BannerCarousel"; // 🧩 Thêm dòng này

export default function HomePage() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const res = await fetch("/api/products");
        if (!res.ok) throw new Error("Không thể tải sản phẩm");
        const data = await res.json();
        setProducts(Array.isArray(data) ? data : []);
      } catch (e: any) {
        console.error("❌ Lỗi tải sản phẩm:", e);
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

  if (loading)
    return <p className="text-center mt-10 text-gray-500">⏳ Đang tải sản phẩm...</p>;

  if (error)
    return (
      <p className="text-center mt-10 text-red-500">
        ⚠️ Lỗi: {error} <br /> Hãy kiểm tra API /api/products.
      </p>
    );

  return (
    <main className="bg-gray-50 min-h-screen pb-20">
      {/* 🧩 Hiển thị banner quảng cáo */}
      <div className="px-4 pt-4 mb-6">
        <BannerCarousel />
      </div>

      <h1 className="text-xl font-bold text-center mt-6 mb-4">🛍 Sản phẩm</h1>

      {products.length === 0 ? (
        <p className="text-center text-gray-500">Chưa có sản phẩm nào.</p>
      ) : (
        <div className="grid gap-4 px-3 sm:px-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
          {products.map((p: any) => (
            <div
              key={p.id}
              onClick={() => router.push(`/product/${p.id}`)}
              className="bg-white rounded-xl shadow hover:shadow-lg transition-all cursor-pointer border border-gray-100 p-3"
            >
              {p.images?.[0] ? (
                <img
                  src={p.images[0]}
                  alt={p.name}
                  loading="lazy"
                  className="w-full aspect-square object-cover rounded-lg mb-2"
                />
              ) : (
                <div className="w-full aspect-square bg-gray-100 flex items-center justify-center rounded-lg mb-2 text-gray-400">
                  Không có ảnh
                </div>
              )}
              <h2 className="font-semibold text-sm text-gray-800 line-clamp-2">
                {p.name}
              </h2>
              <p className="text-orange-600 font-bold text-sm mt-1">
                {p.price} Pi
              </p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
