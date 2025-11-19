"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BannerCarousel from "./components/BannerCarousel";

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

/* ⏳ Đếm thời gian sale */
function getTimeLeftLabel(end?: string | null): string {
  if (!end) return "";
  const endTime = new Date(end).getTime();
  if (isNaN(endTime)) return "";
  const now = Date.now();
  const diff = endTime - now;
  if (diff <= 0) return "Sắp kết thúc";

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff / (1000 * 60)) % 60);

  if (hours <= 0) return `Còn ${minutes} phút`;
  return `Còn ${hours}h ${minutes}p`;
}

export default function HomePage() {
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

  /* 🟢 LOAD DANH MỤC */
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await fetch("/api/categories");
        const data = await res.json();
        setCategories(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("❌ Lỗi tải danh mục:", err);
      } finally {
        setLoadingCategories(false);
      }
    };
    loadCategories();
  }, []);

  /* 🟢 LOAD SẢN PHẨM — FIX SALE & DEAL HOT */
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const res = await fetch("/api/products", { cache: "no-store" });
        if (!res.ok) throw new Error("Không thể tải sản phẩm");

        const data: Product[] = await res.json();
        const now = new Date();

        const normalized = (Array.isArray(data) ? data : []).map((p) => {
          const start = p.saleStart ? new Date(p.saleStart) : null;
          const end = p.saleEnd ? new Date(p.saleEnd) : null;
          let isSale = false;

          if (start && end && p.salePrice) {
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            isSale = now >= start && now <= end;
          }

          return {
            ...p,
            views: p.views ?? 0,
            sold: p.sold ?? 0,
            isSale,
            finalPrice: isSale ? p.salePrice : p.price,
          };
        });

        setProducts(normalized);
        setFilteredProducts(normalized);
      } catch (e: any) {
        console.error("❌ Lỗi tải sản phẩm:", e);
        setError(e?.message || "Không thể tải sản phẩm");
      } finally {
        setLoadingProducts(false);
      }
    };

    loadProducts();
  }, []);

  /* 🔍 LỌC + SẮP XẾP */
  useEffect(() => {
    let list = [...products];

    if (selectedCategory !== "all") {
      list = list.filter(
        (p) => Number(p.categoryId) === Number(selectedCategory)
      );
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
        list.sort((a, b) => (a.finalPrice ?? a.price) - (b.finalPrice ?? b.price));
        break;
      case "priceDesc":
        list.sort((a, b) => (b.finalPrice ?? b.price) - (a.finalPrice ?? a.price));
        break;
      case "popular":
      default:
        list.sort(
          (a, b) =>
            (b.views ?? 0) + (b.sold ?? 0) - ((a.views ?? 0) + (a.sold ?? 0))
        );
    }

    setFilteredProducts(list);
    setVisibleCount(20);
  }, [products, selectedCategory, searchTerm, sortOption]);

  const loadMore = () => setVisibleCount((prev) => prev + 20);

  const saleProducts = products.filter((p) => p.isSale);
  const hotProducts = [...products]
    .filter((p) => {
      if (!p.createdAt) return false;
      const pDate = new Date(p.createdAt);
      return Date.now() - pDate.getTime() < 24 * 60 * 60 * 1000;
    })
    .sort(
      (a, b) =>
        (b.views ?? 0) + (b.sold ?? 0) - ((a.views ?? 0) + (a.sold ?? 0))
    )
    .slice(0, 6);

  /* 🌀 LOADING / ERROR */
  if (loadingProducts)
    return <p className="text-center mt-10 text-gray-500">⏳ Đang tải sản phẩm...</p>;

  if (error)
    return (
      <p className="text-center mt-10 text-red-500">
        ⚠️ Lỗi: {error} <br /> Hãy kiểm tra API /api/products.
      </p>
    );

  /* 🎨 UI CHÍNH */
  return (
    <main className="bg-gray-50 min-h-screen pb-24">
      {/* 🖼 Banner */}
      <div className="w-full mb-3">
        <BannerCarousel />
      </div>

      <div className="px-3 space-y-4 max-w-6xl mx-auto">

        {/* 🔍 Thanh tìm kiếm */}
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center bg-white rounded-full shadow px-3 py-2 border border-gray-200">
            <span className="text-gray-400 mr-2">🔍</span>
            <input
              type="text"
              placeholder="Tìm sản phẩm..."
              className="flex-1 outline-none text-sm bg-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* 🧭 Danh mục */}
        <section>
          <h2 className="text-base font-semibold text-gray-800 mb-2">
            Danh mục nổi bật
          </h2>

          <div className="flex overflow-x-auto space-x-4 pb-2 scrollbar-hide">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`flex flex-col items-center min-w-[70px] text-xs ${
                selectedCategory === "all" ? "font-bold text-orange-600" : ""
              }`}
            >
              <div className="w-14 h-14 rounded-full bg-white border flex items-center justify-center">
                🛍️
              </div>
              <span>Tất cả</span>
            </button>

            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`flex flex-col items-center min-w-[70px] text-xs ${
                  selectedCategory === c.id ? "font-bold text-orange-600" : ""
                }`}
              >
                <img
                  src={c.icon || "/placeholder.png"}
                  alt={c.name}
                  className="w-14 h-14 rounded-full object-cover border"
                />
                <span>{c.name}</span>
              </button>
            ))}
          </div>
        </section>

        {/* ⚡ FLASH SALE */}
        {saleProducts.length > 0 && (
          <section className="bg-gradient-to-r from-red-500 to-orange-500 rounded-xl p-3 text-white shadow">
            <h2 className="font-bold">⚡ Flash Sale đang diễn ra</h2>

            <div className="flex overflow-x-auto space-x-3 scrollbar-hide mt-2">
              {saleProducts.map((p) => (
                <div
                  key={p.id}
                  onClick={() => router.push(`/product/${p.id}`)}
                  className="min-w-[120px] bg-white text-gray-800 rounded-lg p-2 shadow cursor-pointer"
                >
                  <img src={p.images?.[0] || "/placeholder.png"} className="h-20 w-full object-cover rounded" />
                  <p className="text-xs line-clamp-2">{p.name}</p>
                  <p className="font-bold text-red-600">{p.finalPrice} π</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 🔥 DEAL HOT */}
        {hotProducts.length > 0 && (
          <section>
            <h2 className="text-base font-semibold mb-2">🔥 Deal hot hôm nay</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {hotProducts.map((p) => (
                <div
                  key={p.id}
                  onClick={() => router.push(`/product/${p.id}`)}
                  className="bg-white rounded-xl shadow-sm border cursor-pointer hover:shadow-md"
                >
                  <img src={p.images?.[0] || "/placeholder.png"} className="w-full h-28 object-cover" />
                  <div className="p-2 text-xs">
                    <p className="line-clamp-2">{p.name}</p>
                    <p className="text-orange-600 font-bold">{p.finalPrice} π</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 🛒 Tất cả sản phẩm */}
        <section>
          <h2 className="text-base font-bold mb-2">🛒 Tất cả sản phẩm</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {filteredProducts.slice(0, visibleCount).map((p) => (
              <div
                key={p.id}
                onClick={() => router.push(`/product/${p.id}`)}
                className="bg-white rounded-xl shadow-sm border cursor-pointer hover:shadow-md"
              >
                <img src={p.images?.[0] || "/placeholder.png"} className="w-full aspect-square object-cover" />
                <div className="p-2 text-xs">
                  <p className="line-clamp-2">{p.name}</p>
                  <p className="text-orange-600 font-bold">{p.finalPrice} π</p>
                </div>
              </div>
            ))}
          </div>

          {visibleCount < filteredProducts.length && (
            <div className="text-center">
              <button
                onClick={loadMore}
                className="bg-orange-600 text-white px-6 py-2 rounded-full mt-4"
              >
                Xem thêm
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
