"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Home, Grid, Bell, User, PlusCircle } from "lucide-react";
import { useLanguage } from "../app/context/LanguageContext";

export default function BottomNav() {
  const pathname = usePathname();
  const { translate } = useLanguage();
  const [role, setRole] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);

  // 🔹 Lấy username từ localStorage (sau khi đăng nhập)
  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    if (storedUsername) {
      setUsername(storedUsername);
      fetch(`/api/users/role?username=${storedUsername}`)
        .then((res) => res.json())
        .then((data) => {
          if (data?.role) setRole(data.role);
        })
        .catch((err) => console.error("Lỗi lấy quyền người dùng:", err));
    }
  }, []);

  // 🔹 Danh sách menu
  const navItems = [
    { href: "/", label: translate("home") || "Trang chủ", icon: Home },
    { href: "/shop", label: translate("category") || "Danh mục", icon: Grid },
    { href: "/seller", label: translate("post") || "Đăng hàng", icon: PlusCircle },
    { href: "/notifications", label: translate("notifications") || "Thông báo", icon: Bell },
    { href: "/account", label: translate("account") || "Tài khoản", icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-md flex justify-around py-2 z-50">
      {navItems.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href;
        const isPostButton = href === "/seller";
        const isDisabled = isPostButton && role !== "seller";

        return (
          <Link
            key={href}
            href={isDisabled ? "#" : href}
            onClick={(e) => {
              if (isDisabled) e.preventDefault(); // ❌ chặn bấm nhưng không hiển thị gì
            }}
            className={`flex flex-col items-center justify-center transition-all ${
              isActive ? "text-black font-semibold" : "text-gray-500 hover:text-black"
            }`}
          >
            <Icon className={`w-6 h-6 mb-1 ${isActive ? "fill-black" : ""}`} />
            <span className="text-xs">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
