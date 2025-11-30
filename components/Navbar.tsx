"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslation, availableLanguages } from "@/app/lib/i18n";

export default function Navbar() {
  const { t, lang, setLang } = useTranslation();
  const router = useRouter();

  return (
    <header className="bg-orange-500 p-3 text-white flex justify-between items-center">

     <Link href="/cart" aria-label="Giỏ hàng" className="hover:text-yellow-300 transition">
          <ShoppingCart size={22} />
        </Link>

        <div className="absolute left-1/2 -translate-x-1/2">
          <div className="text-xs sm:text-sm font-semibold bg-white text-orange-600 px-3 py-1 rounded-md shadow-sm">
            {loading
              ? `⏳ ${t("loading")}`
              : piPrice
              ? `π1 ≈ ${piPrice.toFixed(2)} USDT`
              : `⚠️ ${t("no_data")}`}
          </div>

        <select
          value={lang}
          onChange={(e) => setLang(e.target.value)}
          className="bg-white text-black text-xs px-2 py-1 rounded"
        >
          {Object.entries(availableLanguages).map(([code, label]) => (
            <option key={code} value={code}>
              {label}
            </option>
          ))}
        </select>
      </div>
    </header>
  );
}
