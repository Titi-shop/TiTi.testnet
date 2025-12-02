"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BannerCarousel from "./components/BannerCarousel";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";

interface Product {
  id: number;
  name: string;
  price: number;
  description?: string;
  images?: string[];
  seller?: string;
  categoryId?: number | null;
  views?: number;
  sold?: number;
  salePrice?: number | null;
  saleStart?: string | null;
  saleEnd?: string | null;
  isSale?: boolean;
  finalPrice?: number;
  createdAt?: string;
}

interface Category {
  id: number;
  name: string;
  icon?: string;
}

type SortOption = "popular" | "newest" | "priceAsc" | "priceDesc";

export default function HomePage() {
  const router = useRouter();
  const { t } = useTranslation();

  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [visibleCount, setVisibleCount] = useState(20);
  const [selectedCategory, setSelectedCategory] = useState<number | "all">("all");
  const [sortOption, setSortOption] = useState<SortOption>("popular");
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 🟢 Fetch Categories
  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data: Category[]) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => setCategories([]))
      .finally(() => setLoadingCategories(false));
  }, []);

  // 🟢 Fetch Products
  useEffect(() => {
    fetch("/api/products", { cache: "force-cache" })
      .then((res) => res.json())
      .then((data: Product[]) => {
        const normalized = (Array.isArray(data) ? data : []).map((p) => ({
          ...p,
          views: p.views ?? 0,
          sold: p.sold ?? 0,
          isSale: Boolean(p.isSale),
          finalPrice:
            p.finalPrice ??
            (p.salePrice && p.isSale ? p.salePrice : p.price),
        }));

        const sorted = [...normalized].sort(
          (a, b) => (b.views ?? 0) - (a.views ?? 0)
        );

        setProducts(sorted);
        setFilteredProducts(sorted);
      })
      .catch((e) => setError(e.message || t.error_loading_products))
      .finally(() => setLoadingProducts(false));
  }, [t]);

  // 🧮 Filter & Sort (đã bỏ tìm kiếm)
  useEffect(() => {
    let list = [...products];

    if (selectedCategory !== "all") {
      list = list.filter((p) => Number(p.categoryId) === selectedCategory);
    }

    switch (sortOption) {
      case "newest":
        list.sort(
          (a, b) =>
            new Date(b.createdAt || "").getTime() -
            new Date(a.createdAt || "").getTime()
        );
        break;
      case "priceAsc":
        list.sort((a, b) => (a.finalPrice ?? a.price) - (b.finalPrice ?? b.price));
        break;
      case "priceDesc":
        list.sort((a, b) => (b.finalPrice ?? b.price) - (a.finalPrice ?? a.price));
        break;
      default:
        list.sort((a, b) => (b.views ?? 0) - (a.views ?? 0));
        break;
    }

    setFilteredProducts(list);
    setVisibleCount(20);
  }, [products, selectedCategory, sortOption]);

  // ⏳ Loading
  if (loadingProducts)
    return <p className="text-center mt-10 text-gray-500">⏳ {t.loading_products}</p>;

  if (error)
    return (
      <p className="text-center mt-10 text-red-500">
        ⚠️ {t.error_loading_products}: {error}
      </p>
    );

  return (
    <main className="bg-gray-50 min-h-screen pb-24">
      {/* 🖼 Banner */}
      <div className="w-full mb-3">
        <BannerCarousel />
      </div>

      <div className="px-3 space-y-4 max-w-6xl mx-auto">

        {/* 🧭 Categories */}
        <section>
  <h2 className="text-base font-semibold">{t.featured_categories}</h2>
  {loadingCategories ? (
    <p>{t.loading_categories}</p>
  ) : (
    <div className="flex overflow-x-auto space-x-4 scrollbar-hide">
      <button
        onClick={() => setSelectedCategory("all")}
        className={`min-w-[70px] text-xs ${
          selectedCategory === "all" ? "font-bold text-orange-600" : ""
        }`}
      >
        🛍 {t.all}
      </button>

      {categories.map((c) => (
        <button
          key={c.id}
          onClick={() => setSelectedCategory(c.id)}
          className={`min-w-[70px] text-xs ${
            selectedCategory === c.id ? "font-bold text-orange-600" : ""
          }`}
        >
          <img
            src={c.icon || "/placeholder.png"}
            className="w-14 h-14 rounded-full"
            alt={t["category_" + c.id] || c.name}
          />

          <span>
            {t["category_" + c.id] || c.name}
          </span>
        </button>
      ))}
    </div>
  )}
</section>

        {/* 📦 All Products */}
        <section>
          <h2 className="text-base font-bold">{t.all_products}</h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {filteredProducts.slice(0, visibleCount).map((p) => (
              <div
                key={p.id}
                onClick={() => router.push(`/product/${p.id}`)}
                className="bg-white rounded-xl shadow border hover:shadow-md duration-200 cursor-pointer"
              >
                <img
                  src={p.images?.[0] || "/placeholder.png"}
                  className="w-full h-32 object-cover rounded"
                />
                <div className="p-2">
                  <p className="text-sm font-medium">{p.name}</p>
                  <p className="text-orange-600 font-bold">{p.finalPrice} π</p>

                  {p.isSale && (
                    <p className="text-xs line-through text-gray-400">
                      {p.price} π
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {visibleCount < filteredProducts.length && (
            <div className="flex justify-center mt-3">
              <button
                onClick={() => setVisibleCount((prev) => prev + 20)}
                className="px-6 py-2 bg-orange-600 text-white rounded-full"
              >
                {t.load_more}
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
