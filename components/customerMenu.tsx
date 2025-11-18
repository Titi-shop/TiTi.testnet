"use client";

import { useRouter } from "next/navigation";
import {
  User,
  Package,
  Wallet,
  HelpCircle,
  MessageCircle,
  Globe,
  MapPin,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const menuItems = [
  { label: "Hồ sơ cá nhân", icon: <User size={22} />, path: "/customer/profile" },
  { label: "Đơn hàng của tôi", icon: <Package size={22} />, path: "/customer/orders" },
  { label: "Ví Pi", icon: <Wallet size={22} />, path: "/customer/wallet" },
  { label: "Tin nhắn", icon: <MessageCircle size={22} />, path: "/customer/messages" },
  { label: "Ngôn ngữ", icon: <Globe size={22} />, path: "/settings/language" },
  { label: "Địa chỉ giao hàng", icon: <MapPin size={22} />, path: "/customer/address" },
  { label: "Hỗ trợ", icon: <HelpCircle size={22} />, path: "/support" },
];

export default function CustomerMenu() {
  const router = useRouter();
  const { user, logout } = useAuth(); // 🔥 Lấy logout từ AuthContext

  return (
    <div className="bg-white mx-3 mt-4 p-4 rounded-lg shadow">
      <div className="grid grid-cols-4 gap-4 text-center">
        {menuItems.map((item, index) => (
          <button
            key={index}
            onClick={() => router.push(item.path)}
            className="flex flex-col items-center text-gray-700 hover:text-orange-500"
          >
            <div className="p-3 bg-gray-100 rounded-full mb-1">
              {item.icon}
            </div>
            <span className="text-sm">{item.label}</span>
          </button>
        ))}
      </div>

      {/* 🔥 Đăng xuất đúng cách: Gọi logout() từ context */}
      {user && (
        <button
          onClick={logout}
          className="flex items-center gap-2 mt-5 text-red-800 font-medium justify-center w-full"
        >
          <LogOut size={20} /> Đăng xuất
        </button>
      )}
    </div>
  );
}
