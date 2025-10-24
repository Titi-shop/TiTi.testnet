"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ShoppingCart, Globe } from "lucide-react";
import { useLanguage } from "@/app/context/LanguageContext";

export default function Navbar() {
  const [piPrice, setPiPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const { translate } = useLanguage();

  // 💰 Lấy giá Pi từ API /api/pi-price
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
    const interval = setInterval(fetchPrice, 5 * 60 * 1000); // cập nhật mỗi 5 phút
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 bg-white border-b shadow-sm z-50">
      {/* Hàng trên: Giỏ hàng - Giá Pi giữa - Ngôn ngữ */}
      <div className="relative flex items-center justify-between px-4 py-2">
        {/* 🛒 Giỏ hàng (trái) */}
        <Link
          href="/cart"
          aria-label="Giỏ hàng"
          className="text-gray-700 hover:text-yellow-500"
        >
          <ShoppingCart size={22} />
        </Link>

        {/* 💰 Giá Pi (giữa) */}
        <div className="absolute left-1/2 -translate-x-1/2">
          <div className="text-xs sm:text-sm font-semibold text-purple-700 bg-purple-50 px-3 py-1 rounded-md shadow-sm">
            {loading
              ? "⏳ " + (translate("loading") || "Đang tải...")
              : piPrice
              ? `💰 1 PI ≈ ${piPrice.toFixed(2)} USDT`
              : "⚠️ " + (translate("no_data") || "Không có dữ liệu")}
          </div>
        </div>

        {/* 🌐 Ngôn ngữ (phải) */}
        <Link
          href="/language"
          aria-label="Ngôn ngữ"
          className="text-gray-700 hover:text-yellow-500"
        >
          <Globe size={22} />
        </Link>
      </div>
    </header>
  );
}
