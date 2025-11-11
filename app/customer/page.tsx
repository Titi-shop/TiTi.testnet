"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/app/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { Clock, Package, Truck, Star, LogOut } from "lucide-react";

export default function CustomerDashboard() {
  const { user, logout, piReady } = useAuth();
  const { translate } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    if (piReady && !user) router.replace("/pilogin");
  }, [piReady, user, router]);

  if (!piReady || !user)
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-500">
        ⏳ Đang tải...
      </main>
    );

  const handleLogoutPi = async () => {
    try {
      if (window?.Pi?.logout) await window.Pi.logout();
    } finally {
      logout();
      router.replace("/pilogin");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-10">
      <div className="bg-orange-500 text-white p-6 text-center shadow">
        <div
          onClick={() => router.push("/customer/profile")}
          className="w-16 h-16 bg-white rounded-full mx-auto mb-3 flex items-center justify-center text-orange-500 font-bold text-xl cursor-pointer"
        >
          {user.username?.charAt(0).toUpperCase()}
        </div>
        <h1 className="text-xl font-semibold">{user.username}</h1>
      </div>

      <div className="bg-white mt-4 rounded-lg shadow mx-3">
        <div className="flex justify-between px-6 py-3 border-b">
          <h2 className="font-semibold text-gray-800 text-lg">
            {translate("my_orders") || "Đơn hàng của tôi"}
          </h2>
          <button
            onClick={() => router.push("/customer/orders")}
            className="text-blue-600 text-sm hover:underline"
          >
            {translate("see_all") || "Xem tất cả"} →
          </button>
        </div>

        <div className="grid grid-cols-5 text-center py-4">
          <button onClick={() => router.push("/customer/pending")}>
            <Clock size={28} />
            <span className="text-sm mt-1">Chờ xác nhận</span>
          </button>
          <button onClick={() => router.push("/customer/pickup")}>
            <Package size={28} />
            <span className="text-sm mt-1">Chờ lấy hàng</span>
          </button>
          <button onClick={() => router.push("/customer/shipping")}>
            <Truck size={28} />
            <span className="text-sm mt-1">Đang giao</span>
          </button>
          <button onClick={() => router.push("/customer/review")}>
            <Star size={28} />
            <span className="text-sm mt-1">Đánh giá</span>
          </button>
          <button
            onClick={handleLogoutPi}
            className="text-red-600 hover:text-red-700"
          >
            <LogOut size={28} />
            <span className="text-sm mt-1">Đăng xuất</span>
          </button>
        </div>
      </div>

      <div className="bg-white mx-3 mt-4 p-4 rounded-lg shadow text-center">
        💰 Ví Pi: <b>{user.wallet_address || "Chưa liên kết"}</b>
      </div>
    </div>
  );
}
