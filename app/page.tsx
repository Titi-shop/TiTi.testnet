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

  /* 🟢 LOAD SẢN PHẨM — FIX SALE & HOT DEAL */
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const res = await fetch("/api/products", { cache: "no-store" });
        if (!res.ok) throw new Error("Không thể tải sản phẩm");

        const data: Product[] = await res.json();
        const now = new Date();

        /* 🎯 Fix Flash Sale đúng ngày */
        const normalized = data.map((p) => {
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

        /* 🔥 Fix Deal Hot hôm nay (Trong 24h) */
        const hotProductsSorted = normalized
          .filter((p) => {
            if (!p.createdAt) return false;
            const pDate = new Date(p.createdAt);
            return now.getTime() - pDate.getTime() < 24 * 60 * 60 * 1000;
          })
          .sort(
            (a, b) =>
              (b.views ?? 0) + (b.sold ?? 0) - ((a.views ?? 0) + (a.sold ?? 0))
          );

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

    /* 🎯 Fix lỗi lọc danh mục */
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
        list.sort((a, b) => (a.finalPrice ?? a.price ?? 0) - (b.finalPrice ?? b.price ?? 0));
        break;
      case "priceDesc":
        list.sort((a, b) => (b.finalPrice ?? b.price ?? 0) - (a.finalPrice ?? a.price ?? 0));
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
    setVisibleCount(20);
  }, [products, selectedCategory, searchTerm, sortOption]);

  const loadMore = () => setVisibleCount((prev) => prev + 20);

  const saleProducts = products.filter((p) => p.isSale);
  const hotProducts = [...products]
    .sort((a, b) => (b.views ?? 0) + (b.sold ?? 0) - ((a.views ?? 0) + (a.sold ?? 0)))
    .slice(0, 6);

  if (loadingProducts)
    return <p className="text-center mt-10 text-gray-500">⏳ Đang tải sản phẩm...</p>;

  if (error)
    return (
      <p className="text-center mt-10 text-red-500">
        ⚠️ Lỗi: {error} <br /> Hãy kiểm tra API /api/products.
      </p>
    );

  return (
    <main className="bg-gray-50 min-h-screen pb-24">
      <div className="w-full mb-3">
        <BannerCarousel />
      </div>

      {/* UI giữ nguyên phần hiển thị như trước */}
      {/* ...phần UI bên dưới giữ nguyên như bạn đang dùng... */}
    </main>
  );
}
