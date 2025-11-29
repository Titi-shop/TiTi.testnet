"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Grid, Bell, User, PlusCircle } from "lucide-react";
import { useTranslation } from "@/app/lib/i18n"; // ⬅ Quan trọng!

export default function BottomNav() {
  const pathname = usePathname();
  const { t } = useTranslation(); // ⬅ Lấy từ i18n

  const navItems = [
    { href: "/", label: t.home, icon: Home },
    { href: "/shop", label: t.category, icon: Grid },
    { href: "/seller", label: "", icon: PlusCircle },
    { href: "/notifications", label: t.notifications, icon: Bell },
    { href: "/account", label: t.me, icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-1 z-50">
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center w-1/5 text-xs ${
              active ? "text-black font-semibold" : "text-gray-500"
            }`}
          >
            <Icon className="w-6 h-6 mb-1" />
            <span className="truncate">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
