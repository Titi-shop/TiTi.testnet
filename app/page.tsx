"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BannerCarousel from "./components/BannerCarousel";
import { useTranslation } from "@/app/lib/i18n";

interface Product {
  id: number;
  name: string;
  price: number;
  salePrice?: number;
  description?: string;
  images?: string[];
  seller?: string;
  categoryId?: number | null;
  views?: number;
  sold?: number;
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
  const { t } = useTranslation();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [visibleCount, setVisibleCount] = useState(20);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | "all">("all");
  const [sortOption, setSortOption] = useState<SortOption>("popular");
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load categories
  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch((err) => console.error("❌ Lỗi tải danh mục:", err))
      .finally(() => setLoadingCategories(false));
  }, []);

  // Load products
  useEffect(() => {
    fetch("/api/products", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        const normalized = data.map((p: Product) => ({
          ...p,
          views: p.views ?? 0,
          sold: p.sold ?? 0,
          isSale: Boolean(p.isSale),
          finalPrice: p.finalPrice ?? (p.isSale ? p.salePrice : p.price),
        }));
        const sorted = normalized.sort((a, b) => (b.views ?? 0) - (a.views ?? 0));
        setProducts(sorted);
        setFilteredProducts(sorted);
      })
      .catch((err) => {
        console.error("❌ Lỗi tải sản phẩm:", err);
        setError(err.message || "Không thể tải sản phẩm");
      })
      .finally(() => setLoadingProducts(false));
  }, []);

  // Filtering & sorting
  useEffect(() => {
    let list = [...products];

    if (selectedCategory !== "all") {
      list = list.filter((p) => Number(p.categoryId) === selectedCategory);
    }

    if (searchTerm.trim()) {
      const keyword = searchTerm.trim().toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(keyword));
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
        list.sort((a, b) => (a.finalPrice ?? 0) - (b.finalPrice ?? 0));
        break;
      case "priceDesc":
        list.sort((a, b) => (b.finalPrice ?? 0) - (a.finalPrice ?? 0));
        break;
      case "popular":
      default:
        list.sort((a, b) => (b.views ?? 0) - (a.views ?? 0));
        break;
    }

    setFilteredProducts(list);
  }, [products, selectedCategory, searchTerm, sortOption]);

  const loadMore = () => setVisibleCount((prev) => prev + 20);

  if (loadingProducts) return <p className="text-center mt-10">{t.loading_products}</p>;
  if (error) return <p className="text-center mt-10 text-red-500">⚠ {error}</p>;

  return (
    <main className="bg-gray-50 min-h-screen pb-24">
      <div className="w-full mb-3">
        <BannerCarousel />
      </div>

      <div className="px-3 space-y-4 max-w-6xl mx-auto">

        {/* Tìm kiếm */}
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center bg-white rounded-full shadow px-3 py-2 border">
            <span className="text-gray-400 mr-2">🔍</span>
            <input
              type="text"
              placeholder={t.search_products}
              className="flex-1 outline-none text-sm bg-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Danh mục */}
        <section>
          <h2 className="text-base font-semibold">{t.featured_categories}</h2>
          {loadingCategories ? (
            <p>{t.loading_categories}</p>
          ) : (
            <div className="flex overflow-x-auto space-x-4 scrollbar-hide">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`min-w-[70px] text-xs ${selectedCategory === "all" ? "font-bold text-orange-600" : ""}`}
              >
                🛍 {t.all}
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`min-w-[70px] text-xs ${selectedCategory === c.id ? "font-bold text-orange-600" : ""}`}
                >
                  <img src={c.icon || "/placeholder.png"} className="w-14 h-14 rounded-full" />
                  {c.name}
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Tất cả sản phẩm */}
        <section>
          <h2 className="text-base font-bold">{t.all_products}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {filteredProducts.slice(0, visibleCount).map((p) => (
              <div
                key={p.id}
                onClick={() => router.push(`/product/${p.id}`)}
                className="bg-white rounded-xl shadow border hover:shadow-md"
              >
                <img src={p.images?.[0] || "/placeholder.png"} className="w-full h-32 object-cover rounded" />
                <div className="p-2">
                  <p className="text-sm font-medium">{p.name}</p>
                  <p className="text-orange-600 font-bold">{p.finalPrice} π</p>
                  {p.isSale && (
                    <p className="text-xs line-through text-gray-400">{p.price} π</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {visibleCount < filteredProducts.length && (
            <div className="flex justify-center mt-3">
              <button
                onClick={loadMore}
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
