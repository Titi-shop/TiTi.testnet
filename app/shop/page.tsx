"use client";

import { useLanguage } from "../context/LanguageContext";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function ShopPage() {
  const { translate } = useLanguage();
  const [products, setProducts] = useState([]);
  const [highlight, setHighlight] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/products");
        const data = await res.json();

        setProducts(data);
        setHighlight(data.slice(0, 8)); // lấy 8 sản phẩm nổi bật
      } catch (err) {
        console.error("⚠️ Lỗi tải sản phẩm:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <main className="p-4 max-w-6xl mx-auto">

      {/* 1️⃣ Tiêu đề Shop */}
      <h1 className="text-2xl font-bold mb-4 text-orange-500">
        🛍️ {translate("shop_title")}
      </h1>

      {/* 2️⃣ (OPTIONAL) Danh mục — nếu bạn muốn thêm */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-2">📁 Danh mục</h2>

        <div className="flex overflow-x-auto space-x-4 pb-2 scrollbar-hide">
          <div className="min-w-[90px] bg-white rounded-xl border shadow p-3 text-center">
            ⚽ Sport
          </div>
          <div className="min-w-[90px] bg-white rounded-xl border shadow p-3 text-center">
            👕 Fashion
          </div>
          <div className="min-w-[90px] bg-white rounded-xl border shadow p-3 text-center">
            🧴 Beauty
          </div>
        </div>
      </section>

      {/* 3️⃣ 🔥 Sản phẩm chạy ngang */}
      <section className="mb-6">
        <h2 className="text-lg font-bold mb-3">🔥 Sản phẩm nổi bật</h2>

        <div className="flex space-x-4 overflow-x-auto scrollbar-hide pb-2">
          {highlight.map((item) => (
            <Link
              key={item.id}
              href={`/product/${item.id}`}
              className="min-w-[160px] bg-white rounded-lg shadow border p-2"
            >
              <img
                src={item.images?.[0] || item.image}
                className="w-full h-24 object-cover rounded"
              />
              <h3 className="mt-2 text-sm font-semibold line-clamp-2">
                {item.name}
              </h3>
              <p className="text-orange-600 font-bold">{item.price} Pi</p>
            </Link>
          ))}
        </div>
      </section>

      {/* 4️⃣ Danh sách sản phẩm dạng lưới */}
      <h2 className="text-xl font-bold mt-4 mb-3">
        📦 {translate("product_list")}
      </h2>

      {loading ? (
        <p className="text-gray-600">⏳ Đang tải...</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {products.map((p) => (
            <Link
              key={p.id}
              href={`/product/${p.id}`}
              className="border rounded-xl shadow hover:shadow-lg transition p-3 flex flex-col bg-white"
            >
              <img
                src={p.images?.[0] || "/placeholder.png"}
                className="rounded-md w-full h-40 object-cover"
              />
              <h3 className="font-semibold mt-2 text-gray-800 line-clamp-2">
                {p.name}
              </h3>
              <p className="text-orange-500 font-medium mt-1">
                {translate("product_price")}: {p.price} Pi
              </p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
