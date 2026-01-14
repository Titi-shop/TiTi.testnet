"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BannerCarousel from "./components/BannerCarousel";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";

/* =========================
   TYPES
========================= */
interface Product {
  id: string;
  name: string;
  price: number;
  images: string[];
  categoryId: number | null;
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
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [visibleCount, setVisibleCount] = useState(20);
  const [selectedCategory, setSelectedCategory] =
    useState<number | "all">("all");
  const [sortOption, setSortOption] =
    useState<SortOption>("popular");
  const [loading, setLoading] = useState(true);

  /* =========================
     FETCH CATEGORIES
  ========================= */
  useEffect(() => {
    fetch("/api/categories", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setCategories(Array.isArray(d) ? d : []));
  }, []);

  /* =========================
     FETCH PRODUCTS
  ========================= */
  useEffect(() => {
    fetch("/api/products", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: Product[]) => {
        setProducts(Array.isArray(data) ? data : []);
        setFiltered(Array.isArray(data) ? data : []);
      })
      .finally(() => setLoading(false));
  }, []);

  /* =========================
     FILTER + SORT
  ========================= */
  useEffect(() => {
    let list = [...products];

    if (selectedCategory !== "all") {
      list = list.filter(
        (p) => p.categoryId === selectedCategory
      );
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
        list.sort(
          (a, b) =>
            (a.finalPrice ?? a.price) -
            (b.finalPrice ?? b.price)
        );
        break;
      case "priceDesc":
        list.sort(
          (a, b) =>
            (b.finalPrice ?? b.price) -
            (a.finalPrice ?? a.price)
        );
        break;
      default:
        break;
    }

    setFiltered(list);
    setVisibleCount(20);
  }, [products, selectedCategory, sortOption]);

  if (loading) {
    return (
      <p className="text-center mt-10">
        ⏳ {t.loading_products}
      </p>
    );
  }

  /* =========================
     UI
  ========================= */
  return (
    <main className="bg-gray-50 min-h-screen pb-24">
      <BannerCarousel />

      <div className="px-3 max-w-6xl mx-auto space-y-6">
        {/* CATEGORIES */}
        <section>
          <h2 className="font-semibold">
            {t.featured_categories}
          </h2>
          <div className="flex overflow-x-auto gap-4">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`text-xs ${
                selectedCategory === "all"
                  ? "text-orange-600 font-bold"
                  : ""
              }`}
            >
              🛍 {t.all}
            </button>

            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`text-xs ${
                  selectedCategory === c.id
                    ? "text-orange-600 font-bold"
                    : ""
                }`}
              >
                <img
                  src={c.icon || "/placeholder.png"}
                  className="w-14 h-14 rounded-full"
                />
                {c.name}
              </button>
            ))}
          </div>
        </section>

        {/* PRODUCTS */}
        <section>
          <h2 className="font-bold">{t.all_products}</h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {filtered.slice(0, visibleCount).map((p) => (
              <div
                key={p.id}
                onClick={() =>
                  router.push(`/product/${p.id}`)
                }
                className="bg-white rounded-xl shadow border cursor-pointer"
              >
                <img
                  src={p.images?.[0] || "/placeholder.png"}
                  className="w-full h-32 object-cover rounded"
                />

                <div className="p-2">
                  <p className="text-sm truncate">
                    {p.name}
                  </p>

                  <p className="font-bold text-orange-600">
                    {p.finalPrice ?? p.price} π
                  </p>

                  {p.isSale && (
                    <p className="text-xs line-through text-gray-400">
                      {p.price} π
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {visibleCount < filtered.length && (
            <div className="text-center mt-4">
              <button
                onClick={() =>
                  setVisibleCount((v) => v + 20)
                }
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
