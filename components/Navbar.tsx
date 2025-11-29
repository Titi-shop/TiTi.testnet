"use client";

import Link from "next/link";
import { ShoppingCart, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/app/lib/i18n"; // 👉 Dùng file i18n.ts

export default function Navbar() {
  const { t, lang, setLang } = useTranslation();
  const router = useRouter();

  const changeLang = (newLang: string) => {
    setLang(newLang); // 👉 Cập nhật state và localStorage
    router.refresh(); // Refresh UI để cập nhật text
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-orange-500 border-b shadow-sm z-50">
      <div className="relative flex items-center justify-between px-4 py-2 text-white">

        {/* 🛒 Cart */}
        <Link href="/cart" aria-label={t.cart}>
          <ShoppingCart size={22} />
        </Link>

        {/* 💱 Pi Price */}
        <div className="absolute left-1/2 -translate-x-1/2 text-xs sm:text-sm bg-white text-orange-600 px-3 py-1 rounded-md shadow-sm font-semibold">
          {t.loading}
        </div>

        {/* 🔍 Search + 🌐 Language Selector */}
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/search")} aria-label={t.search}>
            <Search size={22} />
          </button>

          <select
            value={lang}
            onChange={(e) => changeLang(e.target.value)}
            className="bg-white text-black text-xs px-2 py-1 rounded"
          >
            <option value="vi">🇻🇳 VI</option>
            <option value="en">🇬🇧 EN</option>
            <option value="zh">🇨🇳 中文</option>
          </select>
        </div>
      </div>
    </header>
  );
}
