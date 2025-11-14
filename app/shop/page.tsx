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
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/categories");
        const data = await res.json();
        setCategories(data);
      } catch (err) {
        console.error("❌ Lỗi tải danh mục:", err);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  // 🟢 Load sản phẩm
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/products");
        const data = await res.json();
        setProducts(data);
      } catch (err) {
        console.error("❌ Lỗi tải sản phẩm:", err);
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchProducts();
  }, []);

  // 🎯 Lọc ra 3 sản phẩm đầu tiên
  const top3 = products.slice(0, 3);

  // 🎯 Các sản phẩm còn lại (grid sẽ hiển thị sau slider)
  const remainingProducts = products.slice(3);

  return (
    <main className="pb-20 bg-gray-100 min-h-screen">

      {/* BANNER */}
      <div className="w-full">
        <img
          src="/banner.jpg"
          alt="banner"
          className="w-full h-36 object-cover"
        />
      </div>

      <div className="px-4 mt-2">

        {/* 🟠 DANH MỤC TRƯỢT NGANG */}
        <h2 className="text-xl font-semibold text-gray-700 mb-2">
          Category
        </h2>

        <div className="flex overflow-x-auto space-x-5 pb-3">
          {loadingCategories ? (
            <p className="text-gray-500">Đang tải...</p>
          ) : categories.length === 0 ? (
            <p className="text-gray-500">Không có danh mục nào.</p>
          ) : (
            categories.map((c) => (
              <Link
                key={c.id}
                href={`/category/${c.id}`}
                className="flex flex-col items-center min-w-[80px]"
              >
                <img
                  src={c.icon || "/placeholder.png"}
                  alt={c.name}
                  className="w-14 h-14 rounded-full border object-cover"
                />
                <span className="text-sm mt-1 text-center">{c.name}</span>
              </Link>
            ))
          )}
        </div>

        {/* 🟣 TIÊU ĐỀ */}
        <h2 className="text-xl font-bold text-orange-600 mt-4 mb-2">
          🛍️ Danh mục sản phẩm
        </h2>

        {/* 1️⃣ HIỂN THỊ 3 SẢN PHẨM ĐẦU TIÊN */}
        <div className="grid grid-cols-2 gap-3">
          {top3.map((p) => (
            <Link
              key={p.id}
              href={`/product/${p.id}`}
              className="bg-white p-3 rounded-xl shadow border"
            >
              <img
                src={p.images?.[0] || "/placeholder.png"}
                alt={p.name}
                className="w-full h-32 object-cover rounded-md"
              />
              <h3 className="font-medium mt-2">{p.name}</h3>
              <p className="text-orange-600 font-semibold">
                Giá (Pi): {p.price} Pi
              </p>
            </Link>
          ))}
        </div>

        {/* ⭐ 2️⃣ THANH SẢN PHẨM TRƯỢT NGANG — HÀNG THỨ 3 ⭐ */}
        <h3 className="text-lg font-semibold mt-4 mb-2 text-gray-700">
          🔥 Gợi ý hôm nay
        </h3>

        <div className="flex overflow-x-auto space-x-4 pb-3 scrollbar-hide">
          {products.map((p) => (
            <Link
              key={p.id}
              href={`/product/${p.id}`}
              className="min-w-[150px] bg-white rounded-xl border shadow p-2"
            >
              <img
                src={p.images?.[0] || "/placeholder.png"}
                className="w-full h-24 object-cover rounded-md"
              />
              <h4 className="text-sm font-medium mt-1 line-clamp-2">
                {p.name}
              </h4>
              <p className="text-orange-600 font-bold text-sm">
                {p.price} Pi
              </p>
            </Link>
          ))}
        </div>

        {/* 3️⃣ HIỂN THỊ PHẦN SẢN PHẨM CÒN LẠI (GRID) */}
        <h3 className="text-xl font-bold text-orange-600 mt-4 mb-2">
          📦 Tất cả sản phẩm
        </h3>

        <div className="grid grid-cols-2 gap-3">
          {remainingProducts.map((p) => (
            <Link
              key={p.id}
              href={`/product/${p.id}`}
              className="bg-white p-3 rounded-xl shadow border"
            >
              <img
                src={p.images?.[0] || "/placeholder.png"}
                alt={p.name}
                className="w-full h-32 object-cover rounded-md"
              />
              <h3 className="font-medium mt-2">{p.name}</h3>
              <p className="text-orange-600 font-semibold">
                Giá (Pi): {p.price} Pi
              </p>
            </Link>
          ))}
        </div>

      </div>
    </main>
  );
}
