"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Home, Grid, Bell, User, ShoppingCart, Globe } from "lucide-react";
import { useLanguage } from "@/app/context/LanguageContext";

export default function Navbar() {
  const pathname = usePathname();
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
    const interval = setInterval(fetchPrice, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // 🔹 Danh sách các trang điều hướng
  const navItems = [
    { href: "/", label: translate("home") || "Trang chủ", icon: Home },
    { href: "/shop", label: translate("category") || "Danh mục", icon: Grid },
    { href: "/notifications", label: translate("notifications") || "Thông báo", icon: Bell },
    { href: "/account", label: translate("account") || "Tài khoản", icon: User },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 bg-white border-b shadow-sm z-50">
      {/* 🔹 Hàng trên: Giỏ hàng + Giá Pi + Ngôn ngữ */}
      <div className="flex items-center justify-between px-4 py-2">
        {/* 🛒 Giỏ hàng */}
        <Link href="/cart" className="text-gray-700 hover:text-yellow-500">
          <ShoppingCart size={22} />
        </Link>

        {/* 💰 Giá Pi ở giữa — nhỏ gọn, hiện đại */}
        <div className="text-sm font-semibold text-purple-700 bg-purple-50 px-3 py-1 rounded-md shadow-sm">
          {loading
            ? "⏳ " + (translate("loading") || "Đang tải...")
            : piPrice
            ? `💰 1 PI ≈ ${piPrice.toFixed(2)} USDT`
            : "⚠️ " + (translate("no_data") || "Không có dữ liệu")}
        </div>

        {/* 🌐 Ngôn ngữ */}
        <Link href="/language" className="text-gray-700 hover:text-yellow-500">
          <Globe size={22} />
        </Link>
      </div>

      {/* 🔹 Hàng dưới: Thanh điều hướng các trang */}
      <nav className="flex justify-around border-t bg-gray-50 py-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center text-xs ${
                active ? "text-indigo-600 font-semibold" : "text-gray-500 hover:text-black"
              }`}
            >
              <Icon className={`w-5 h-5 mb-1 ${active ? "stroke-indigo-600" : ""}`} />
              {label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
