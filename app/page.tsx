"use client";
import { useEffect, useState, useMemo } from "react";
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
  const [categories, setCategories] = useState<Category[]>([]);
  const [visibleCount, setVisibleCount] = useState(20);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | "all">("all");
  const [sortOption, setSortOption] = useState<SortOption>("popular");
  const [loading, setLoading] = useState(true);

  // Load categories
  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => setCategories([]));
  }, []);

  // Load products
  useEffect(() => {
    fetch("/api/products", { cache: "force-cache" })
      .then((res) => res.json())
      .then((data) => {
        const normalized = data.map((p: Product) => ({
          ...p,
          views: p.views ?? 0,
          sold: p.sold ?? 0,
          isSale: Boolean(p.isSale),
          finalPrice: p.finalPrice ?? (p.isSale ? p.salePrice : p.price),
        }));
        setProducts(normalized);
      })
      .finally(() => setLoading(false));
  }, []);

  // Filtering & sorting
  const filteredProducts = useMemo(() => {
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
        list.sort((a, b) => new Date(b.createdAt || "").getTime() - new Date(a.createdAt || "").getTime());
        break;
      case "priceAsc":
        list.sort((a, b) => (a.finalPrice ?? 0) - (b.finalPrice ?? 0));
        break;
      case "priceDesc":
        list.sort((a, b) => (b.finalPrice ?? 0) - (a.finalPrice ?? 0));
        break;
      default:
        list.sort((a, b) => (b.views ?? 0) - (a.views ?? 0));
        break;
    }

    return list;
  }, [products, selectedCategory, searchTerm, sortOption]);

  const loadMore = () => setVisibleCount((prev) => prev + 20);

  if (loading) return <p className="text-center mt-10">{t.loading_products || "Loading products..."}</p>;

  return (
    <main className="bg-gray-50 min-h-screen pb-24">
      {/* Banner */}
      <div className="w-full mb-3">
        <BannerCarousel />
      </div>

      <div className="px-3 space-y-4 max-w-6xl mx-auto">

        {/* Search */}
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center bg-white rounded-full shadow px-3 py-2 border">
            <span className="text-gray-400 mr-2">🔍</span>
            <input
              type="text"
              placeholder={t.search_products || "Search products..."}
              className="flex-1 outline-none text-sm bg-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Categories */}
        <section>
          <h2 className="text-base font-semibold">{t.featured_categories || "Featured Categories"}</h2>
          <div className="flex overflow-x-auto space-x-4 scrollbar-hide">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`min-w-[70px] text-xs ${selectedCategory === "all" ? "font-bold text-orange-600" : ""}`}
            >
              🛍 {t.all || "All"}
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
        </section>

        {/* All Products */}
        <section>
          <h2 className="text-base font-bold">{t.all_products || "All Products"}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {filteredProducts.slice(0, visibleCount).map((p) => (
              <div
                key={p.id}
                onClick={() => router.push(`/product/${p.id}`)}
                className="bg-white rounded-xl shadow border hover:shadow-md duration-200 cursor-pointer"
              >
                <img src={p.images?.[0] || "/placeholder.png"} className="w-full h-32 object-cover rounded" />
                <div className="p-2">
                  <p className="text-sm font-medium line-clamp-2">{p.name}</p>
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
                {t.load_more || "Load more"}
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
