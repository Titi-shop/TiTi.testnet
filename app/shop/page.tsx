"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function ShopPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [visibleCount, setVisibleCount] = useState(20);

  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);

  /* ============================
     🟢 LOAD DANH MỤC
  ============================ */
  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => {
        setCategories(data || []);
        setLoadingCategories(false);
      });
  }, []);

  /* ============================
     🟢 LOAD TẤT CẢ SẢN PHẨM
  ============================ */
  useEffect(() => {
    fetch("/api/products", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        const normalized = data.map((p: any) => ({
          ...p,
          views: p.views || 0,
          sold: p.sold || 0,
          finalPrice: p.finalPrice ?? p.salePrice ?? p.price,
        }));

        setProducts(normalized);
        setLoadingProducts(false);
      });
  }, []);

  const loadMore = () => setVisibleCount((prev) => prev + 20);

  /* ============================
     🟠 SLIDER 1 - GIÁ CAO NHẤT
  ============================ */
  const highestPrice = [...products]
    .sort((a, b) => b.price - a.price)
    .slice(0, 10);

  /* ============================
     🟣 SLIDER 2 - SẢN PHẨM MỚI
  ============================ */
  const newest = [...products]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 10);

  /* ============================
     🔥 SLIDER 3 - ĐANG GIẢM GIÁ
  ============================ */
  const now = new Date();
  const saleList = products.filter((p) => {
    if (!p.salePrice || !p.saleStart || !p.saleEnd) return false;
    const start = new Date(p.saleStart);
    const end = new Date(p.saleEnd);
    return now >= start && now <= end;
  });

  /* ============================
     🟦 COMPONENT SLIDER
  ============================ */
  const Slider = ({ title, items }: any) => (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-3">{title}</h2>
      <div className="flex overflow-x-auto space-x-4 scrollbar-hide">
        {items.length === 0 ? (
          <p className="text-gray-500 text-sm">Không có dữ liệu</p>
        ) : (
          items.map((p: any) => {
            const salePercent =
              p.salePrice && p.price
                ? Math.round(((p.price - p.salePrice) / p.price) * 100)
                : 0;

            const final = p.finalPrice ?? p.salePrice ?? p.price;

            return (
              <Link
                key={p.id}
                href={`/product/${p.id}`}
                className="relative min-w-[150px] bg-white rounded-lg shadow p-2 border cursor-pointer"
              >
                {salePercent > 0 && (
                  <span className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full">
                    -{salePercent}%
                  </span>
                )}

                <img
                  src={p.images?.[0] || "/placeholder.png"}
                  alt={p.name}
                  className="w-full h-24 object-cover rounded"
                />

                <h3 className="mt-2 text-sm font-semibold truncate text-gray-800">
                  {p.name}
                </h3>

                <p className="text-orange-600 font-bold text-sm">{final} π</p>

                {p.salePrice && (
                  <p className="text-gray-400 text-xs line-through">
                    {p.price} π
                  </p>
                )}
              </Link>
            );
          })
        )}
      </div>
    </div>
  );

  /* ============================
     ⭐⭐ UI CHÍNH ⭐⭐
  ============================ */
  return (
    <main className="pb-20 bg-white min-h-screen">
      {/* ⭐ BANNER */}
      <img
        src="/banners/Messenger_creation_9F1CAD64-6ACE-4FF9-9EFF-E68A79A745AD.jpeg"
        alt="banner"
        className="w-full h-40 object-cover"
      />

      <div className="mt-3">
        {/* ⭐ DANH MỤC */}
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Danh mục</h2>

        {loadingCategories ? (
          <p className="text-gray-500">Đang tải danh mục...</p>
        ) : (
          <div className="flex overflow-x-auto space-x-6 pb-3 scrollbar-hide">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/category/${c.id}`}
                className="flex flex-col items-center min-w-[70px]"
              >
                <img
                  src={c.icon || "/placeholder.png"}
                  className="w-14 h-14 rounded-full object-cover border"
                />
                <span className="text-sm mt-1 text-center">{c.name}</span>
              </Link>
            ))}
          </div>
        )}

        {/* ⭐⭐⭐ 3 SLIDER SẢN PHẨM ⭐⭐⭐ */}
        <Slider title="💎 Giá cao nhất" items={highestPrice} />
        <Slider title="🆕 Sản phẩm mới nhất" items={newest} />
        <Slider title="⚡ Đang giảm giá" items={saleList} />

        {/* ⭐⭐⭐ TẤT CẢ SẢN PHẨM ⭐⭐⭐ */}
        <h2 className="text-xl font-bold mt-6 mb-3 px-3">🛍️ Tất cả sản phẩm</h2>

        {loadingProducts ? (
          <p className="text-gray-500">Đang tải sản phẩm...</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 px-3">
              {products.slice(0, visibleCount).map((item: any) => {
                const salePercent =
                  item.salePrice && item.price
                    ? Math.round(((item.price - item.salePrice) / item.price) * 100)
                    : 0;

                const final = item.finalPrice ?? item.salePrice ?? item.price;

                return (
                  <Link
                    key={item.id}
                    href={`/product/${item.id}`}
                    className="bg-white p-2 rounded-lg shadow border relative"
                  >
                    {salePercent > 0 && (
                      <span className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full">
                        -{salePercent}%
                      </span>
                    )}

                    <img
                      src={item.images?.[0] || "/placeholder.png"}
                      className="w-full h-28 object-cover rounded"
                    />

                    <h3 className="mt-2 text-sm font-semibold truncate text-gray-800">
                      {item.name}
                    </h3>

                    {/* ⭐ Giá đúng logic */}
                    <p className="text-orange-600 font-bold">{final} π</p>

                    {item.salePrice && (
                      <p className="text-xs line-through text-gray-400">
                        {item.price} π
                      </p>
                    )}

                    <p className="text-xs text-gray-500 mt-1">
                      {item.views} lượt xem
                    </p>
                  </Link>
                );
              })}
            </div>

            {/* ⭐ NÚT XEM THÊM ⭐ */}
            {visibleCount < products.length && (
              <div className="flex justify-center mt-4">
                <button
                  onClick={loadMore}
                  className="px-6 py-2 bg-orange-600 text-white rounded-full font-semibold shadow"
                >
                  Xem thêm
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
