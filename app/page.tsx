"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import BannerCarousel from "./components/BannerCarousel";
import { useLanguage } from "../context/LanguageContext"; // ✅ import

export default function HomePage() {
  const router = useRouter();
  const { t, language, setLanguage } = useLanguage(); // ✅ Lấy ngôn ngữ & hàm dịch
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const res = await fetch("/api/products");
        if (!res.ok) throw new Error(t("error"));
        const data = await res.json();
        setProducts(Array.isArray(data) ? data : []);
      } catch (e: any) {
        console.error("❌", e);
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, [t]);

  if (loading) return <p className="text-center mt-10 text-gray-500">{t("loading")}</p>;
  if (error) return <p className="text-center mt-10 text-red-500">{t("error")}</p>;

  return (
    <main className="bg-white min-h-screen pb-20">
      {/* 🌐 Nút chuyển ngôn ngữ */}
      <div className="flex justify-end p-3">
        <button
          onClick={() => setLanguage(language === "vi" ? "en" : "vi")}
          className="text-sm px-3 py-1 border rounded-lg hover:bg-gray-100 transition"
        >
          {language === "vi" ? "🇺🇸 English" : "🇻🇳 Tiếng Việt"}
        </button>
      </div>

      {/* Banner */}
      <div className="mb-2">
        <BannerCarousel />
      </div>

      {/* Sản phẩm */}
      {products.length === 0 ? (
        <p className="text-center text-gray-500 mt-4">{t("noProducts")}</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-[1px] bg-gray-100">
          {products.map((p: any) => (
            <div
              key={p.id}
              onClick={() => router.push(`/product/${p.id}`)}
              className="bg-white cursor-pointer transition-transform hover:scale-[1.01] active:scale-[0.98]"
            >
              {p.images?.[0] ? (
                <img
                  src={p.images[0]}
                  alt={p.name}
                  loading="lazy"
                  className="w-full aspect-square object-cover"
                />
              ) : (
                <div className="w-full aspect-square bg-gray-100 flex items-center justify-center text-gray-400">
                  Không có ảnh
                </div>
              )}

              <div className="p-2">
                <h2 className="text-[13px] font-medium text-gray-800 line-clamp-2 leading-tight">
                  {p.name}
                </h2>
                <div className="flex items-center gap-1 mt-1">
                  <p className="text-orange-600 font-bold text-[13px]">{p.price}</p>
                  <Image src="/pi-icon.png" alt="Pi" width={14} height={14} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
