"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ShoppingCart, Globe } from "lucide-react";
import { useTranslations } from "next-intl";

export default function Navbar() {
  const [piPrice, setPiPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const t = useTranslations();

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const res = await fetch("/api/pi-price");
        const data = await res.json();
        if (data?.price_usd) setPiPrice(parseFloat(data.price_usd));
      } catch (error) {
        console.error("⚠️ Lỗi khi lấy giá Pi:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPrice();
    const interval = setInterval(fetchPrice, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 bg-orange-500 border-b shadow-sm z-50">
      <div className="relative flex items-center justify-between px-4 py-2 text-white">

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
        </div>

        <Link
          href="/language"
          aria-label="Ngôn ngữ"
          className="hover:text-yellow-300 transition"
        >
          <Globe size={22} />
        </Link>
      </div>
    </header>
  );
}
