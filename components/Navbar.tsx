"use client";

import Link from "next/link";
import { ShoppingCart, Search, Globe } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/app/lib/i18n";

export default function Navbar() {
  const { t, lang, setLang } = useTranslation();
  const router = useRouter();

  // Hàm chuyển đổi ngôn ngữ xoay vòng VI → EN → ZH
  const toggleLang = () => {
    const nextLang = lang === "vi" ? "en" : lang === "en" ? "zh" : "vi";
    setLang(nextLang);
    router.refresh();
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-orange-500 border-b shadow-sm z-50">
      <div className="relative flex items-center justify-between px-4 py-2 text-white">

        {/* 🛒 Cart */}
        <Link href="/cart" aria-label={t.cart}>
          <ShoppingCart size={22} />
        </Link>

        {/* 🔍 Search + 🌐 Nút đổi ngôn ngữ */}
        <div className="flex items-center gap-3 ml-auto">
          <button onClick={() => router.push("/search")} aria-label={t.search}>
            <Search size={22} />
          </button>

          {/* 🌐 Nút đổi ngôn ngữ */}
          <button
            onClick={toggleLang}
            aria-label="Đổi ngôn ngữ"
            className="text-white hover:text-yellow-300 transition"
          >
            {lang === "vi" ? "🇻🇳" : lang === "en" ? "🇬🇧" : "🇨🇳"}
          </button>
        </div>
      </div>
    </header>
  );
}
