"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import HorizontalProductSlider from "@/app/components/HorizontalProductSlider";

export default function ShopPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // 🟢 Load danh mục
  useEffect(() => {
    const loadCategories = async () => {
      const res = await fetch("/api/categories");
      const data = await res.json();
      setCategories(data);
      setLoadingCategories(false);
    };
    loadCategories();
  }, []);

  // 🟢 Load tất cả sản phẩm
  useEffect(() => {
    fetch("/api/products", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        setProducts(data);
        setLoadingProducts(false);
      });
  }, []);

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
                  src={c.icon}
                  className="w-14 h-14 rounded-full object-cover border"
                />
                <span className="text-sm mt-1 text-center">{c.name}</span>
              </Link>
            ))}
          </div>
        )}

        {/* ⭐⭐⭐ CÁC THANH NGANG SẢN PHẨM ⭐⭐⭐ */}

        <HorizontalProductSlider title="💎 Hot " type="highest" />

        <HorizontalProductSlider title="🆕 Sản phẩm mới nhất" type="newest" />

        <HorizontalProductSlider title="⚡ Đang giảm giá" type="sale" />

        <HorizontalProductSlider title="👕 Thời trang" type="fashion" />

        <HorizontalProductSlider title="📱 Điện thoại" type="phone" />

        <HorizontalProductSlider title="🔌 Thiết bị điện tử" type="electronic" />

        {/* ⭐⭐⭐ HIỂN THỊ TẤT CẢ SẢN PHẨM ⭐⭐⭐ */}
        <h2 className="text-xl font-bold mt-6 mb-3">🛍️ Tất cả sản phẩm</h2>

        {loadingProducts ? (
          <p className="text-gray-500">Đang tải sản phẩm...</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 px-2">
            {products.slice(0, 40).map((item) => {
              const salePercent =
                item.salePrice && item.price
                  ? Math.round(((item.price - item.salePrice) / item.price) * 100)
                  : 0;

              return (
                <Link
                  key={item.id}
                  href={`/product/${item.id}`}
                  className="bg-white p-2 rounded-lg shadow border relative"
                >
                  {/* Badge SALE */}
                  {salePercent > 0 && (
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

                  {item.salePrice ? (
                    <div>
                      <p className="text-red-600 font-bold">
                        {item.salePrice} π
                      </p>
                      <p className="text-xs line-through text-gray-400">
                        {item.price} π
                      </p>
                    </div>
                  ) : (
                    <p className="text-orange-600 font-bold">
                      {item.price} π
                    </p>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
