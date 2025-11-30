"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslation, availableLanguages } from "@/app/lib/i18n";

export default function Navbar() {
  const { t, lang, setLang } = useTranslation();
  const router = useRouter();

  // ⭐ Thêm khai báo cho giá Pi
  const [piPrice, setPiPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // ⭐ Fetch giá Pi từ API (có khai báo đúng useEffect)
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
    <header className="bg-orange-500 p-3 text-white flex justify-between items-center">

      {/* Giỏ hàng (trái) */}
      <Link href="/cart" aria-label="Giỏ hàng">
        <ShoppingCart size={22} />
      </Link>

      {/* 💰 Giá Pi (giữa) */}
      <div className="text-xs font-semibold bg-white text-orange-600 px-3 py-1 rounded-md shadow-sm">
        {loading
          ? `⏳ ${t("loading")}`
          : piPrice
          ? `π1 ≈ ${piPrice.toFixed(2)} USDT`
          : `⚠️ ${t("no_data")}`}
      </div>

      {/* 🌐 Dropdown (phải) */}
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
