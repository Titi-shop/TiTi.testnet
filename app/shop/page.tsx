"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/app/lib/i18n";

interface Product {
  id: number;
  name: string;
  price: number;
  salePrice?: number;
  saleStart?: string;
  saleEnd?: string;
  isSale?: boolean;
  createdAt?: string;
  views?: number;
  images?: string[];
}

interface Category {
  id: number;
  name: string;
  icon: string;
}

export default function ShopPage() {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [visibleCount, setVisibleCount] = useState(20);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => {
        setCategories(data);
        setLoadingCategories(false);
      });
  }, []);

  useEffect(() => {
    fetch("/api/products", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        const enriched = data.map((p: Product) => ({
          ...p,
          views: p.views || 0,
          isSale:
            p.saleStart &&
            p.saleEnd &&
            p.salePrice &&
            new Date() >= new Date(p.saleStart) &&
            new Date() <= new Date(p.saleEnd),
        }));
        setProducts(enriched);
        setLoadingProducts(false);
      });
  }, []);

  const loadMore = () => setVisibleCount((prev) => prev + 20);

  return (
    <main className="pb-20 bg-white min-h-screen">
      {/* Banner */}
      <img
        src="/banners/Messenger_creation_9F1CAD64-6ACE-4FF9-9EFF-E68A79A745AD.jpeg"
        className="w-full h-40 object-cover"
        alt="banner"
      />

      <div className="mt-3 px-3">
        {/* Danh mục */}
        <h2 className="text-xl font-semibold mb-2">{t.categories}</h2>
        {loadingCategories ? (
          <p className="text-gray-500">{t.loading_categories}</p>
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
                  alt={t["category_" + c.id] || c.name}
                />
                <span className="text-sm mt-1 text-center">
                  {t["category_" + c.id] || c.name}
                </span>
              </Link>
            ))}
          </div>
        )}

        {/* Flash Sale & Product Rows */}
        <ProductRow
          title={t.highest_price}
          items={[...products].sort((a, b) => b.price - a.price).slice(0, 10)}
        />
        <ProductRow
          title={t.newest_products}
          items={[...products]
            .sort(
              (a, b) =>
                new Date(b.createdAt || "").getTime() -
                new Date(a.createdAt || "").getTime()
            )
            .slice(0, 10)}
        />
        <ProductRow
          title={t.discount_products}
          items={products.filter((p) => p.isSale)}
        />

        {/* Tất cả sản phẩm */}
        <h2 className="text-xl font-bold mt-6 mb-3">{t.all_products}</h2>
        {loadingProducts ? (
          <p className="text-gray-500">{t.loading_products}</p>
