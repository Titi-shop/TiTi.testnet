"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import Link from "next/link";

export default function ShopPage() {
  const { user, loading: authLoading, piReady } = useAuth();
  const { translate } = useLanguage();

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 🟢 Load products + categories
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const productRes = await fetch("/api/products");
        const productData = await productRes.json();
        setProducts(productData);

        const cateRes = await fetch("/api/categories");
        const cateData = await cateRes.json();
        setCategories(cateData);

      } catch (err) {
        console.error("❌ Lỗi tải dữ liệu Shop:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  // 🟡 Chờ Pi SDK load + user auth
  if (!piReady || authLoading) {
    return (
      <main className="p-4 text-center text-gray-600">
        ⏳ {translate("loading") || "Đang tải..."}
      </main>
    );
  }

  // ❤️ Nếu chưa login bằng Pi
  if (!user) {
    return (
      <main className="p-6 flex flex-col items-center">
        <p className="text-gray-700 mb-4 text-lg">
          Bạn cần đăng nhập bằng Pi để xem Shop
        </p>
        <button
          onClick={() => window.location.href = "/login"}
          className="bg-orange-600 text-white px-5 py-2 rounded-lg shadow"
        >
          🔐 Đăng nhập bằng Pi
        </button>
      </main>
    );
  }

  return (
    <main className="pb-6 max-w-6xl mx-auto">

      {/* 🔥 Banner */}
      <div className="w-full h-40 sm:h-56 bg-gray-200 rounded-xl overflow-hidden mb-4">
        <img
          src="/banner_shop.jpg"
          className="w-full h-full object-cover"
          alt="shop banner"
        />
      </div>

      {/* 🏷 Danh mục ngang */}
      <h2 className="text-lg font-bold text-gray-800 mb-2 px-4">
        {translate("categories") || "Danh mục"}
      </h2>

      <div className="flex gap-4 overflow-x-auto px-4 pb-3">
        {categories.length === 0 ? (
          <p className="text-gray-500">Không có danh mục</p>
        ) : (
          categories.map((c) => (
            <Link
              key={c.id}
              href={`/category/${c.id}`}
              className="flex flex-col items-center min-w-[80px]"
            >
              <img
                src={c.icon || "/placeholder.png"}
                className="w-14 h-14 rounded-full object-cover border"
              />
              <span className="text-sm mt-1 text-center">{c.name}</span>
            </Link>
          ))
        )}
      </div>

      {/* 🛍 DANH SÁCH SẢN PHẨM */}
      <h2 className="text-lg font-bold text-gray-800 mt-4 mb-2 px-4">
        🛍️ {translate("shop_title") || "Sản phẩm nổi bật"}
      </h2>

      {loading ? (
        <p className="text-gray-600 px-4">⏳ Đang tải sản phẩm...</p>
      ) : products.length === 0 ? (
        <p className="text-gray-500 px-4">Chưa có sản phẩm nào.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 px-4">
          {products.map((p) => (
            <Link
              key={p.id}
              href={`/product/${p.id}`}
              className="border rounded-xl bg-white shadow hover:scale-[1.02] transition p-3 flex flex-col"
            >
              <img
                src={p.images?.[0] || "/placeholder.png"}
                className="rounded-md w-full h-40 object-cover"
                alt={p.name}
              />

              <h3 className="font-medium mt-2 text-gray-800 line-clamp-2">
                {p.name}
              </h3>

              <p className="text-orange-500 font-semibold mt-1">
                {p.price} Pi
              </p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
