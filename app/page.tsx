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
  const [selectedCategory, setSelectedCategory] = useState<number | "all">(
    "all"
  );
  const [sortOption, setSortOption] = useState<SortOption>("popular");

  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ============================
     🟢 LOAD DANH MỤC
  ============================ */
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

/* ============================
   🟢 LOAD SẢN PHẨM — FIX SALE ĐÚNG NGÀY
============================ */
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

        // ⭐ Fix lỗi ngày không đúng: xử lý giờ trong ngày
        if (start && end && p.salePrice) {
          start.setHours(0, 0, 0, 0);
          end.setHours(23, 59, 59, 999);

          if (now.getTime() >= start.getTime() && now.getTime() <= end.getTime()) {
            isSale = true;
          }
        }

        return {
          ...p,
          views: p.views ?? 0,
          sold: p.sold ?? 0,
          isSale,
          finalPrice: isSale ? p.salePrice : p.price,
        };
      });

      // ⭐ Mặc định sắp xếp theo độ hot = views + sold
      const sorted = [...normalized].sort(
        (a, b) => (b.views ?? 0) + (b.sold ?? 0) - ((a.views ?? 0) + (a.sold ?? 0))
      );

      setProducts(sorted);
      setFilteredProducts(sorted);
    } catch (e: any) {
      console.error("❌ Lỗi tải sản phẩm:", e);
      setError(e?.message || "Không thể tải sản phẩm");
    } finally {
      setLoadingProducts(false);
    }
  };

  loadProducts();
}, []);
  /* ============================
     🔍 LỌC + SẮP XẾP
  ============================ */
  useEffect(() => {
    let list = [...products];

    // Lọc theo danh mục
    if (selectedCategory !== "all") {
      list = list.filter((p) => Number(p.categoryId) === selectedCategory);
    }

    // Lọc theo từ khóa
    if (searchTerm.trim()) {
      const keyword = searchTerm.trim().toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(keyword));
    }

    // Sắp xếp
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
            (a.finalPrice ?? a.price ?? 0) - (b.finalPrice ?? b.price ?? 0)
        );
        break;
      case "priceDesc":
        list.sort(
          (a, b) =>
            (b.finalPrice ?? b.price ?? 0) - (a.finalPrice ?? a.price ?? 0)
        );
        break;
      case "popular":
      default:
        list.sort(
          (a, b) =>
            (b.views ?? 0) + (b.sold ?? 0) - ((a.views ?? 0) + (a.sold ?? 0))
        );
        break;
    }

    setFilteredProducts(list);
    setVisibleCount(20); // reset khi lọc/sắp xếp
  }, [products, selectedCategory, searchTerm, sortOption]);

  const loadMore = () => {
    setVisibleCount((prev) => prev + 20);
  };

  const saleProducts = products.filter((p) => p.isSale);
  const hotProducts = [...products]
    .sort(
      (a, b) =>
        (b.views ?? 0) + (b.sold ?? 0) - ((a.views ?? 0) + (a.sold ?? 0))
    )
    .slice(0, 6);

  /* ============================
     ⏳ LOADING / ERROR
  ============================ */
  if (loadingProducts)
    return (
      <p className="text-center mt-10 text-gray-500">
        ⏳ Đang tải sản phẩm...
      </p>
    );

  if (error)
    return (
      <p className="text-center mt-10 text-red-500">
        ⚠️ Lỗi: {error} <br /> Hãy kiểm tra API /api/products.
      </p>
    );

  /* ============================
     🎨 UI CHÍNH
  ============================ */
  return (
    <main className="bg-gray-50 min-h-screen pb-24">
      {/* 🖼 Banner lớn */}
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

        {/* 🧭 Danh mục trượt ngang */}
        <section>
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-base font-semibold text-gray-800">
              Danh mục nổi bật
            </h2>
          </div>

          {loadingCategories ? (
            <p className="text-gray-500 text-sm">Đang tải danh mục...</p>
          ) : (
            <div className="flex overflow-x-auto space-x-4 pb-2 scrollbar-hide">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`flex flex-col items-center min-w-[70px] text-xs ${
                  selectedCategory === "all" ? "font-bold text-orange-600" : ""
                }`}
              >
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center border ${
                    selectedCategory === "all"
                      ? "bg-orange-50 border-orange-500"
                      : "bg-white"
                  }`}
                >
                  🛍️
                </div>
                <span className="mt-1 text-center">Tất cả</span>
              </button>

              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`flex flex-col items-center min-w-[70px] text-xs ${
                    selectedCategory === c.id
                      ? "font-bold text-orange-600"
                      : ""
                  }`}
                >
                  <img
                    src={c.icon || "/placeholder.png"}
                    alt={c.name}
                    className={`w-14 h-14 rounded-full object-cover border ${
                      selectedCategory === c.id
                        ? "border-orange-500"
                        : "border-gray-200"
                    }`}
                  />
                  <span className="mt-1 text-center">{c.name}</span>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* ⚡ FLASH SALE */}
        {saleProducts.length > 0 && (
          <section className="bg-gradient-to-r from-red-500 to-orange-500 rounded-xl p-3 text-white shadow">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">⚡</span>
                <h2 className="font-bold text-base">Flash Sale đang diễn ra</h2>
              </div>
              <span className="text-xs opacity-90">
                {getTimeLeftLabel(
                  saleProducts
                    .map((p) => p.saleEnd)
                    .filter(Boolean)
                    .sort()[0] || null
                )}
              </span>
            </div>

            <div className="flex overflow-x-auto space-x-3 scrollbar-hide">
              {saleProducts.slice(0, 10).map((p) => {
                const price = p.finalPrice ?? p.salePrice ?? p.price;
                const salePercent =
                  p.salePrice && p.price
                    ? Math.round(
                        ((p.price - p.salePrice) / p.price) * 100
                      )
                    : 0;

                return (
                  <div
                    key={p.id}
                    onClick={() => router.push(`/product/${p.id}`)}
                    className="min-w-[120px] bg-white/95 rounded-lg p-2 text-xs text-gray-800 cursor-pointer shadow-sm"
                  >
                    <div className="relative w-full h-20 rounded overflow-hidden mb-1">
                      <img
                        src={p.images?.[0] || "/placeholder.png"}
                        alt={p.name}
                        className="w-full h-full object-cover"
                      />
                      {salePercent > 0 && (
                        <span className="absolute top-1 left-1 bg-red-600 text-[10px] text-white px-1.5 py-0.5 rounded-full">
                          -{salePercent}%
                        </span>
                      )}
                    </div>
                    <p className="line-clamp-2 text-[11px] font-medium">
                      {p.name}
                    </p>
                    <p className="text-red-600 font-bold mt-0.5">
                      {price} π
                    </p>
                    {p.price && p.salePrice && (
                      <p className="text-[10px] line-through text-gray-400">
                        {p.price} π
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* 🔥 DEAL HOT */}
        {hotProducts.length > 0 && (
          <section>
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-base font-semibold text-gray-800">
                🔥 Deal hot hôm nay
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {hotProducts.map((p) => {
                const price = p.finalPrice ?? p.salePrice ?? p.price;
                const salePercent =
                  p.salePrice && p.price
                    ? Math.round(
                        ((p.price - p.salePrice) / p.price) * 100
                      )
                    : 0;
                return (
                  <div
                    key={p.id}
                    onClick={() => router.push(`/product/${p.id}`)}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-md transition"
                  >
                    <div className="relative w-full h-28">
                      <img
                        src={p.images?.[0] || "/placeholder.png"}
                        alt={p.name}
                        className="w-full h-full object-cover"
                      />
                      {salePercent > 0 && (
                        <span className="absolute top-2 left-2 bg-red-600 text-[10px] text-white px-2 py-0.5 rounded-full">
                          -{salePercent}%
                        </span>
                      )}
                    </div>
                    <div className="p-2">
                      <p className="text-[13px] font-medium text-gray-800 line-clamp-2">
                        {p.name}
                      </p>
                      <p className="text-orange-600 font-bold text-[13px] mt-1">
                        {price} π
                      </p>
                      {p.price && p.salePrice && (
                        <p className="text-[11px] line-through text-gray-400">
                          {p.price} π
                        </p>
                      )}
                      <p className="text-[11px] text-gray-500 mt-1">
                        👁 {p.views ?? 0} · Đã bán {p.sold ?? 0}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* 🎚️ THANH LỌC & SẮP XẾP */}
        <section className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-bold text-gray-900">
             Tất cả sản phẩm
            </h2>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-500">Sắp xếp:</span>
              <select
                className="border border-gray-300 rounded-full px-2 py-1 text-xs bg-white"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
              >
                <option value="popular">Phổ biến</option>
                <option value="newest">Mới nhất</option>
                <option value="priceAsc">Giá tăng dần</option>
                <option value="priceDesc">Giá giảm dần</option>
              </select>
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <p className="text-gray-500 text-sm">
              Không tìm thấy sản phẩm phù hợp.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {filteredProducts.slice(0, visibleCount).map((p) => {
                  const price = p.finalPrice ?? p.salePrice ?? p.price;
                  const salePercent =
                    p.salePrice && p.price
                      ? Math.round(
                          ((p.price - p.salePrice) / p.price) * 100
                        )
                      : 0;

                  return (
                    <div
                      key={p.id}
                      onClick={() => router.push(`/product/${p.id}`)}
                      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-md transition"
                    >
                      <div className="relative w-full aspect-square">
                        <img
                          src={p.images?.[0] || "/placeholder.png"}
                          alt={p.name}
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                        {salePercent > 0 && (
                          <span className="absolute top-2 left-2 bg-red-600 text-[10px] text-white px-2 py-0.5 rounded-full">
                            -{salePercent}%
                          </span>
                        )}
                      </div>

                      <div className="p-2">
                        <h3 className="text-[13px] font-medium text-gray-800 line-clamp-2 leading-tight">
                          {p.name}
                        </h3>
                        <p className="text-orange-600 font-bold text-[13px] mt-1">
                          {price} π
                        </p>
                        {p.price && p.salePrice && (
                          <p className="text-[11px] line-through text-gray-400">
                            {p.price} π
                          </p>
                        )}
                        <p className="text-[11px] text-gray-500 mt-1">
                          👁 {p.views ?? 0} · Đã bán {p.sold ?? 0}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {visibleCount < filteredProducts.length && (
                <div className="flex justify-center mt-4">
                  <button
                    onClick={loadMore}
                    className="px-6 py-2 bg-orange-600 text-white rounded-full font-semibold shadow"
                  >
                    Xem thêm
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
