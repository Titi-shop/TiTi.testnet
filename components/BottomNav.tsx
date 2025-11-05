"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Home, Grid, Bell, User, PlusCircle } from "lucide-react";
import { useLanguage } from "../app/context/LanguageContext";

type RoleState = "unknown" | "loading" | "ready";
export default function BottomNav() {
  const pathname = usePathname();
  const { translate } = useLanguage();

  const [role, setRole] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [status, setStatus] = useState<RoleState>("unknown");

  // Lấy username và quyền
  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    if (!storedUsername) {
      setUsername(null);
      setRole(null);
      setStatus("ready");
      return;
    }
    setUsername(storedUsername);
    setStatus("loading");
    fetch(`/api/users/role?username=${storedUsername}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.role) setRole(data.role);
      })
      .catch(() => {
        // Nếu lỗi, coi như chưa có quyền hợp lệ
        setRole(null);
      })
      .finally(() => setStatus("ready"));
  }, []);

  const navItems = [
    { href: "/", label: translate("home") || "Trang chủ", icon: Home },
    { href: "/shop", label: translate("category") || "Danh mục", icon: Grid },
    { href: "/seller", label: translate("post") || "Đăng hàng", icon: PlusCircle },
    { href: "/notifications", label: translate("notifications") || "Thông báo", icon: Bell },
    { href: "/account", label: translate("account") || "Tài khoản", icon: User },
  ];

  // Điều kiện cho nút Đăng hàng
  const canPost =
    status === "ready" && username && role === "seller"; // chỉ khi đã biết chắc là seller

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-md flex justify-around py-2 z-50">
      {navItems.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href;
        const isPostButton = href === "/seller";
        const disabled = isPostButton ? !canPost : false;

        return (
          <Link
            key={href}
            href={disabled ? "#" : href}
            onClick={(e) => {
              if (disabled) e.preventDefault(); // chặn bấm nhưng không hiện gì
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
