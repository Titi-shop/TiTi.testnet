"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/app/lib/i18n";

export default function ShopPage() {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [visibleCount, setVisibleCount] = useState(20);

  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // 🔹 Load danh mục
  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => {
        setCategories(data);
        setLoadingCategories(false);
      });
  }, []);

  // 🔹 Load sản phẩm
  useEffect(() => {
    fetch("/api/products", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        const sorted = data
          .map((p: any) => ({ ...p, views: p.views || 0 }))
          .sort((a: any, b: any) => b.views - a.views);

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
        
        {/* 🏷 DANH MỤC */}
        <h2 className="text-xl font-semibold mb-2">{t("categories")}</h2>

        {loadingCategories ? (
          <p className="text-gray-500">{t("loading_categories")}</p>
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

        {/* 🔹 Sắp xếp theo các tiêu chí */}
        <ProductRow title={t("highest_price")} items={
          [...products].sort((a, b) => b.price - a.price).slice(0, 10)
        } />

        <ProductRow title={t("newest_products")} items={
          [...products].sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          ).slice(0, 10)
        } />

        <ProductRow title={t("discount_products")} items={products.filter(p => p.isSale)} />

        {/* 🔹 Tất cả sản phẩm */}
        <h2 className="text-xl font-bold mt-6 mb-3">{t("all_products")}</h2>

        {loadingProducts ? (
          <p className="text-gray-500">{t("loading_products")}</p>
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
                    {item.isSale && salePercent > 0 && (
                      <span className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full">
                        -{salePercent}%
                      </span>
                    )}

                    <img
                      src={item.images?.[0] || "/placeholder.png"}
                      className="w-full h-28 object-cover rounded"
                    />

                    <h3 className="mt-2 text-sm font-semibold truncate">{item.name}</h3>

                    {item.isSale ? (
