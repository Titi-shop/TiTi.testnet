"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function ShopPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [visibleCount, setVisibleCount] = useState(20);

  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);

  /* =============================
      LOAD DANH MỤC
  ============================== */
  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => {
        setCategories(data);
        setLoadingCategories(false);
      });
  }, []);

  /* =============================
      LOAD TẤT CẢ SẢN PHẨM
  ============================== */
  useEffect(() => {
    fetch("/api/products", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        const withViews = data.map((p: any) => ({
          ...p,
          views: p.views || 0,
        }));

        const sorted = withViews.sort((a, b) => b.views - a.views);

        setProducts(sorted);
        setLoadingProducts(false);
      });
  }, []);

  const loadMore = () => setVisibleCount((prev) => prev + 20);

  return (
    <main className="pb-20 bg-white min-h-screen">

      {/* BANNER */}
      <img
        src="/banners/Messenger_creation_9F1CAD64-6ACE-4FF9-9EFF-E68A79A745AD.jpeg"
        className="w-full h-40 object-cover"
      />

      <div className="mt-3">
        
        {/* DANH MỤC */}
        <h2 className="text-xl font-semibold mb-2">Danh mục</h2>

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
                  src={c.icon}
                  className="w-14 h-14 rounded-full object-cover border"
                />
                <span className="text-sm mt-1 text-center">{c.name}</span>
              </Link>
            ))}
          </div>
        )}

        {/* ==============================
            3 SLIDER SẢN PHẨM
        =============================== */}

        {/* 1 — Giá cao nhất */}
        <ProductRow title="💎 Giá cao nhất" items={
          [...products].sort((a,b)=>b.price - a.price).slice(0,10)
        } />

        {/* 2 — Sản phẩm mới */}
        <ProductRow title="🆕 Sản phẩm mới nhất" items={
          [...products].sort(
            (a,b)=>new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          ).slice(0,10)
        } />

        {/* 3 — Đang giảm giá (API đã tính đúng ngày) */}
        <ProductRow title="⚡ Đang giảm giá" items={
          products.filter(p => p.isSale)
        } />

        {/* ==============================
           TẤT CẢ SẢN PHẨM
        =============================== */}
        <h2 className="text-xl font-bold mt-6 mb-3">🛍️ Tất cả sản phẩm</h2>

        {loadingProducts ? (
          <p className="text-gray-500">Đang tải sản phẩm...</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 px-2">
              {products.slice(0, visibleCount).map((item) => {
                const salePercent =
                  item.isSale && item.salePrice
                    ? Math.round(((item.price - item.salePrice) / item.price) * 100)
                    : 0;

                return (
                  <Link
                    key={item.id}
                    href={`/product/${item.id}`}
                    className="bg-white p-2 rounded-lg shadow border relative"
                  >
                    {/* BADGE SALE */}
                    {item.isSale && salePercent > 0 && (
                      <span className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full">
                        -{salePercent}%
                      </span>
                    )}

                    <img
                      src={item.images?.[0] || "/placeholder.png"}
                      className="w-full h-28 object-cover rounded"
                    />

                    <h3 className="mt-2 text-sm font-semibold truncate">
                      {item.name}
                    </h3>

                    {/* GIÁ SALE ĐÚNG NGÀY */}
                    {item.isSale ? (
                      <>
                        <p className="text-red-600 font-bold">{item.salePrice} π</p>
                        <p className="text-xs line-through text-gray-400">
                          {item.price} π
                        </p>
                      </>
                    ) : (
                      <p className="text-orange-600 font-bold">
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

/* ============================================
   COMPONENT HIỂN THỊ SLIDER SẢN PHẨM
=============================================== */
function ProductRow({ title, items }: any) {
  return (
    <div className="p-3">
      <h3 className="font-bold mb-2">{title}</h3>

      <div className="flex overflow-x-auto gap-4 scrollbar-hide">
        {items.map((p: any) => {
          const salePercent =
            p.isSale && p.salePrice
              ? Math.round(((p.price - p.salePrice) / p.price) * 100)
              : 0;

          return (
            <Link
              key={p.id}
              href={`/product/${p.id}`}
              className="min-w-[140px] bg-white border rounded-lg p-2 shadow relative"
            >
              {p.isSale && salePercent > 0 && (
                <span className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full">
                  -{salePercent}%
                </span>
              )}

              <img
                src={p.images?.[0] || "/placeholder.png"}
                className="w-full h-24 object-cover rounded"
              />

              <p className="text-sm font-semibold mt-2 truncate">{p.name}</p>

              {p.isSale ? (
                <>
                  <p className="text-red-600 font-bold">{p.salePrice} π</p>
                  <p className="text-xs line-through text-gray-400">
                    {p.price} π
                  </p>
                </>
              ) : (
                <p className="text-orange-600 font-bold">{p.price} π</p>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
