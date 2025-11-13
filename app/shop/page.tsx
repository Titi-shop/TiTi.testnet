"use client";

import { useLanguage } from "../context/LanguageContext";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function ShopPage() {
  const { translate } = useLanguage();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const categories = [
    { name: "Sport & Outdoor", icon: "/icons/sport.png" },
    { name: "Automotive", icon: "/icons/auto.png" },
    { name: "Grocery", icon: "/icons/grocery.png" },
    { name: "Home & Living", icon: "/icons/home.png" },
    { name: "Beauty", icon: "/icons/beauty.png" },
    { name: "Electronics", icon: "/icons/electronics.png" },
    { name: "Fashion", icon: "/icons/fashion.png" },
  ];

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/products");
        const data = await res.json();
        setProducts(data);
      } catch (err) {
        console.error("❌ Lỗi tải sản phẩm:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  return (
    <main className="pb-28 bg-gray-100 min-h-screen">

      {/* 🔶 Banner giống Shopee */}
      <div className="w-full">
        <img
          src="/banners/shop-banner.jpg"
          alt="banner"
          className="w-full h-40 object-cover"
        />
      </div>

      {/* 🔶 Category ngang (scrollable) */}
      <h2 className="text-lg font-bold px-4 mt-4">Category</h2>

      <div className="flex space-x-6 overflow-x-auto px-4 py-3 scrollbar-hide">
        {categories.map((c, idx) => (
          <div
            key={idx}
            className="flex flex-col items-center min-w-[70px]"
          >
            <img
              src={c.icon}
              alt={c.name}
              className="w-12 h-12 rounded-full bg-white shadow"
            />
            <span className="text-xs mt-1 text-center">{c.name}</span>
          </div>
        ))}
      </div>

      {/* 🔶 Tiêu đề sản phẩm */}
      <h1 className="text-xl font-bold mt-2 px-4 text-orange-500">
        🛍️ {translate("shop_title")}
      </h1>

      {/* 🔶 Loading & sản phẩm */}
      <div className="p-4 max-w-6xl mx-auto">
        {loading ? (
          <p className="text-gray-600">⏳ {translate("loading")}</p>
        ) : products.length === 0 ? (
          <p className="text-gray-500">{translate("no_products")}</p>
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
                  alt={p.name}
                  className="rounded-md w-full h-36 object-cover"
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
      </div>
    </main>
  );
}
