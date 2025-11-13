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

        {/* 🛒 SẢN PHẨM */}
        {loadingProducts ? (
          <p className="text-gray-500">Đang tải sản phẩm...</p>
        ) : products.length === 0 ? (
          <p className="text-gray-500">Chưa có sản phẩm.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {products.map((p) => (
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
        )}
      </div>
    </main>
  );
}
