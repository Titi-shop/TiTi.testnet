"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslation, availableLanguages } from "@/app/lib/i18n";

export default function Navbar() {
  const { t, lang, setLang } = useTranslation();
  const [piPrice, setPiPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const res = await fetch("/api/pi-price");
        const data = await res.json();
        if (data?.price_usd) setPiPrice(parseFloat(data.price_usd));
      } catch (error) {
        console.error("⚠️ Lỗi lấy giá Pi:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPrice();

    const interval = setInterval(fetchPrice, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-orange-500 p-3 text-white flex justify-between items-center relative">

      {/* Giỏ hàng (trái) */}
      <Link href="/cart" aria-label="Giỏ hàng" className="hover:text-yellow-300 transition">
        <ShoppingCart size={22} />
      </Link>

      {/* Hiển thị giá Pi (giữa) */}
      <div className="absolute left-1/2 -translate-x-1/2">
        <div className="text-xs sm:text-sm font-semibold bg-white text-orange-600 px-3 py-1 rounded-md shadow-sm">
          {loading
            ? `⏳ ${t("loading")}`
            : piPrice
            ? `π1 ≈ ${piPrice.toFixed(2)} USDT`
            : `⚠️ ${t("no_data")}`}
        </div>
      </div>

      {/* Chọn ngôn ngữ (phải) */}
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
    </header>
  );
}
