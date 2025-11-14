"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function ShopPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);

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

  // 🟢 Load sản phẩm
  useEffect(() => {
    const loadProducts = async () => {
      const res = await fetch("/api/products");
      const data = await res.json();
      setProducts(data);
      setLoadingProducts(false);
    };
    loadProducts();
  }, []);

  // Lấy 3 sản phẩm đầu tiên
  const top3 = products.slice(0, 3);
  const remaining = products.slice(3);

  return (
    <main className="pb-20 bg-white min-h-screen">

      {/* BANNER */}
      <img
        src="/banner.jpg"
        alt="banner"
        className="w-full h-40 object-cover"
      />

      <div className="px-4 mt-3">

        {/* CATEGORY */}
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Danh mục</h2>

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

        {/* TIÊU ĐỀ */}
        <h2 className="text-xl font-bold text-orange-600 mt-4 mb-2">
          🛍 Danh mục sản phẩm
        </h2>

        {/* TOP 3 SẢN PHẨM */}
        <div className="grid grid-cols-2 gap-4">
          {top3.map((p) => (
            <Link
              key={p.id}
              href={`/product/${p.id}`}
              className="rounded-xl overflow-hidden bg-white"
            >
              <img
                src={p.images?.[0]}
                className="w-full h-36 object-cover"
              />
              <div className="p-2">
                <h3 className="text-sm font-medium">{p.name}</h3>
                <p className="text-orange-600 font-semibold">{p.price} Pi</p>
              </div>
            </Link>
          ))}
        </div>

        {/* THANH NGANG 1 */}
        <h3 className="text-lg font-semibold mt-4 mb-2">🔥 Gợi ý hôm nay</h3>

        <div className="flex overflow-x-auto space-x-4 pb-3 scrollbar-hide">
          {products.map((p) => (
            <Link
              key={p.id}
              href={`/product/${p.id}`}
              className="min-w-[150px] rounded-xl overflow-hidden bg-white"
            >
              <img
                src={p.images?.[0]}
                className="w-full h-28 object-cover"
              />
              <div className="p-2">
                <h4 className="text-sm font-medium line-clamp-2">{p.name}</h4>
                <p className="text-orange-600 font-bold">{p.price} Pi</p>
              </div>
            </Link>
          ))}
        </div>

        {/* TẤT CẢ SẢN PHẨM */}
        <h3 className="text-xl font-bold text-orange-600 mt-4 mb-2">📦 Tất cả sản phẩm</h3>

        <div className="grid grid-cols-2 gap-4">
          {remaining.map((p) => (
            <Link
              key={p.id}
              href={`/product/${p.id}`}
              className="rounded-xl overflow-hidden bg-white"
            >
              <img
                src={p.images?.[0]}
                className="w-full h-36 object-cover"
              />
              <div className="p-2">
                <h3 className="text-sm font-medium">{p.name}</h3>
                <p className="text-orange-600 font-bold">{p.price} Pi</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
