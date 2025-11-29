"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BannerCarousel from "./components/BannerCarousel";
import { useTranslation } from "@/app/lib/i18n"; // ⬅️ ADD

// ... (giữ nguyên các interface)

export default function HomePage() {
  const router = useRouter();
  const { t } = useTranslation(); // ⬅️ ADD

  // ... (giữ nguyên state & useEffect)

  if (loadingProducts)
    return <p className="text-center mt-10 text-gray-500">{t.loading_products}</p>;

  if (error)
    return (
      <p className="text-center mt-10 text-red-500">
        ⚠️ {t.error_loading} <br /> {t.check_api}
      </p>
    );

  return (
    <main className="bg-gray-50 min-h-screen pb-24">
      <div className="w-full mb-3">
        <BannerCarousel />
      </div>

      <div className="px-3 space-y-4 max-w-6xl mx-auto">
        {/* SEARCH */}
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center bg-white rounded-full px-3 py-2">
            <span className="text-gray-400 mr-2">🔍</span>
            <input
              placeholder={t.search_placeholder}
              className="flex-1 outline-none text-sm bg-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* CATEGORY */}
        <section>
          <h2 className="text-base font-semibold">{t.featured_categories}</h2>
          {loadingCategories ? (
            <p>{t.loading_categories}</p>
          ) : (
            <div className="flex overflow-x-auto space-x-4">
              <button onClick={() => setSelectedCategory("all")}>
                {t.all_products}
              </button>
              {categories.map((c) => (
                <button key={c.id} onClick={() => setSelectedCategory(c.id)}>
                  {c.name}
                </button>
              ))}
            </div>
          )}
        </section>

        {/* FLASH SALE */}
        {saleProducts.length > 0 && (
          <section className="bg-gradient-to-r from-red-500 to-orange-500 p-3 text-white">
            <h2>{t.flash_sale}</h2>
          </section>
        )}

        {/* DEAL HOT */}
        <h2>{t.hot_deals_today}</h2>

        {/* ALL PRODUCTS */}
        <h2 className="text-base font-bold">{t.all_products}</h2>
