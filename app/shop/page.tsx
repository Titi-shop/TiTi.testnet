"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";

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
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 px-2">
              {products.slice(0, visibleCount).map((item) => {
                const salePercent =
                  item.isSale && item.salePrice
                    ? Math.round(
                        ((item.price - item.salePrice) / item.price) * 100
                      )
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
                      alt={item.name}
                    />

                    <h3 className="mt-2 text-sm font-semibold truncate">
                      {item.name}
                    </h3>

                    {item.isSale ? (
                      <>
                        <p className="text-red-600 font-bold">
                          {item.salePrice} π
                        </p>
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
                      {item.views} {t.views}
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
                  {t.load_more}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function ProductRow({
  title,
  items,
}: {
  title: string;
  items: Product[];
}) {
  const { t } = useTranslation();
  if (!items || items.length === 0) return null;

  return (
    <div className="p-3">
      <h3 className="font-bold mb-2">{title}</h3>
      <div className="flex overflow-x-auto gap-4 scrollbar-hide">
        {items.map((p) => {
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
                alt={p.name}
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
