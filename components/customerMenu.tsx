"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { User, Package, Wallet, Phone, LogOut } from "lucide-react";

export default function CustomerMenu() {
  const router = useRouter();
  const { user, logout } = useAuth();

  return (
    <div className="bg-white shadow-lg rounded-lg p-4 w-64 border absolute top-16 right-4 z-50">
      <div className="flex items-center gap-3 border-b pb-3 mb-3">
        <div className="w-12 h-12 rounded-full bg-orange-500 text-white flex items-center justify-center text-lg font-bold">
          {user?.username?.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-bold">@{user?.username}</p>
          <p className="text-sm text-gray-500">{user?.appName || "Chưa đặt biệt danh"}</p>
        </div>
      </div>

      <ul className="space-y-3">
        <li
          onClick={() => router.push("/customer/profile")}
          className="flex items-center gap-3 cursor-pointer hover:text-orange-500"
        >
          <User size={20} /> Hồ sơ cá nhân
        </li>

        <li
          onClick={() => router.push("/customer/orders")}
          className="flex items-center gap-3 cursor-pointer hover:text-orange-500"
        >
          <Package size={20} /> Đơn hàng của tôi
        </li>

        <li
          onClick={() => router.push("/customer/wallet")}
          className="flex items-center gap-3 cursor-pointer hover:text-orange-500"
        >
          <Wallet size={20} /> Ví Pi
        </li>

        <li
          onClick={() => router.push("/customer/support")}
          className="flex items-center gap-3 cursor-pointer hover:text-orange-500"
        >
          <Phone size={20} /> Hỗ trợ
        </li>

        <li
          onClick={() => {
            logout();
            router.push("/account");
          }}
          className="flex items-center gap-3 text-red-500 cursor-pointer hover:text-red-600"
        >
          <LogOut size={20} /> Đăng xuất
        </li>
      </ul>
    </div>
  );
}
