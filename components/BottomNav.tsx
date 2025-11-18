"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Grid, Bell, User, Search } from "lucide-react"; // 🔹 Đổi PlusCircle thành Search
import { useLanguage } from "../app/context/LanguageContext";

export default function BottomNav() {
  const pathname = usePathname();
  const { translate } = useLanguage();

  const navItems = [
    { href: "/", label: translate("home") || "Trang chủ", icon: Home },
    { href: "/shop", label: translate("category") || "Danh mục", icon: Grid },

    // 🔹 Nút giữa đổi thành Search
    { href: "/search", label: translate("search") || "Tìm kiếm", icon: Search },

    { href: "/notifications", label: translate("notifications") || "Thông báo", icon: Bell },
    { href: "/account", label: translate("me") || "Tôi", icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-1 z-50">
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center justify-center w-1/5 text-xs transition-all ${
              active ? "text-black font-semibold" : "text-gray-500 hover:text-black"
            }`}
          >
            <Icon
              className={`w-6 h-6 mb-1 ${
                active ? "text-black" : "text-gray-500"
              }`}
            />
            <span className="text-center truncate w-full">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
