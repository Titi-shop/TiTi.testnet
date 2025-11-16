"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BannerCarousel from "./components/BannerCarousel";

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
    return (
      <p className="text-center mt-10 text-gray-500">
        ⏳ Đang tải sản phẩm...
      </p>
    );

  if (error)
    return (
      <p className="text-center mt-10 text-red-500">
        ⚠️ Lỗi: {error} <br /> Kiểm tra lại API /api/products.
      </p>
    );

  return (
    <main className="bg-gray-50 min-h-screen pb-20">
      {/* 🖼 Banner */}
      <div className="w-full mb-3">
        <BannerCarousel />
      </div>

      {/* 🛍 GRID SẢN PHẨM */}
      {products.length === 0 ? (
        <p className="text-center text-gray-500 mt-4">🚫 Chưa có sản phẩm nào.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 px-2">
          {products.map((p) => {
            const now = new Date();
            const start = p.saleStart ? new Date(p.saleStart) : null;
            const end = p.saleEnd ? new Date(p.saleEnd) : null;
            const isSale =
              p.salePrice && start && end && now >= start && now <= end;

            const salePercent =
              isSale && p.price && p.salePrice
                ? Math.round(((p.price - p.salePrice) / p.price) * 100)
                : 0;

            return (
              <div
                key={p.id}
                onClick={() => router.push(`/product/${p.id}`)}
                className="bg-white rounded-lg shadow-sm border hover:shadow-md cursor-pointer transition-all p-2 relative"
              >
                {/* ⭐ BADGE SALE */}
                {isSale && (
                  <span className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full shadow">
                    -{salePercent}%
                  </span>
                )}

                {/* Ảnh sản phẩm */}
                {p.images?.[0] ? (
                  <img
                    src={p.images[0]}
                    alt={p.name}
                    className="w-full h-40 object-cover rounded-md"
                  />
                ) : (
                  <div className="w-full h-40 bg-gray-100 flex items-center justify-center text-gray-400 rounded-md">
                    Không có ảnh
                  </div>
                )}

                {/* Tên + giá */}
                <div className="mt-2">
                  <h2 className="text-sm font-semibold text-gray-800 line-clamp-2 leading-tight">
                    {p.name}
                  </h2>

                  {/* ⭐ GIÁ SALE */}
                  {isSale ? (
                    <div className="mt-1">
                      <p className="text-red-600 font-bold text-[14px]">
                        {p.salePrice} π
                      </p>
                      <p className="text-gray-400 text-[12px] line-through">
                        {p.price} π
                      </p>
                    </div>
                  ) : (
                    <p className="text-orange-600 font-bold text-[14px] mt-1">
                      {p.price} π
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
