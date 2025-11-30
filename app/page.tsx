"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import BannerCarousel from "./components/BannerCarousel";
import { useTranslation } from "@/app/lib/i18n";

export default function HomePage() {
  const { t } = useTranslation();
  const router = useRouter();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [visibleCount, setVisibleCount] = useState(20);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/categories").then((r) => r.json()),
      fetch("/api/products", { cache: "force-cache" }).then((r) => r.json()),
    ]).then(([catData, prodData]) => {
      setCategories(catData);
      setProducts(prodData);
    }).finally(() => setLoading(false));
  }, []);

  const filteredProducts = useMemo(() => {
    let list = [...products];
    if (selectedCategory !== "all") {
      list = list.filter((p) => p.categoryId === selectedCategory);
    }
    if (searchTerm.trim()) {
      list = list.filter((p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return list;
  }, [products, selectedCategory, searchTerm]);

  if (loading) return <p className="text-center mt-10">{t.loading_products}</p>;

  return (
    <main className="bg-gray-50 min-h-screen pb-24">
      <BannerCarousel />

      <div className="px-3 space-y-4">
        <input
          placeholder={t.search_products}
          className="border p-2 w-full"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {/* DANH MỤC */}
        <div className="flex gap-3 overflow-x-auto">
          <button onClick={() => setSelectedCategory("all")}>🛍 {t.all}</button>
          {categories.map((c) => (
            <button key={c.id} onClick={() => setSelectedCategory(c.id)}>
              {c.name}
            </button>
          ))}
        </div>

        {/* SẢN PHẨM */}
        <div className="grid grid-cols-2 gap-3">
          {filteredProducts.slice(0, visibleCount).map((p: any) => (
            <div key={p.id} onClick={() => router.push(`/product/${p.id}`)}>
              <img src={p.images?.[0] || "/placeholder.png"} />
              <p>{p.name}</p>
              <p>{p.finalPrice || p.price} π</p>
            </div>
          ))}
        </div>

        {visibleCount < filteredProducts.length && (
          <button onClick={() => setVisibleCount((v) => v + 20)}>
            {t.load_more}
          </button>
        )}
      </div>
    </main>
  );
}
