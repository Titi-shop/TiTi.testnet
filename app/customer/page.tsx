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
    if (piReady && !user) {
      router.replace("/pilogin");
    }
  }, [piReady, user, router]);

  if (!piReady || !user)
    return (
      <main className="min-h-screen flex items-center justify-center text-gray-500">
        ⏳ Đang tải...
      </main>
    );

  const handleLogoutPi = async () => {
    try {
      if (window?.Pi?.logout) await window.Pi.logout();
    } catch (err) {
      console.warn("⚠️ Pi logout error:", err);
    } finally {
      logout();
      router.replace("/pilogin");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-10">
      {/* Header */}
      <div className="bg-orange-500 text-white p-6 text-center shadow">
        <div
          onClick={() => router.push("/customer/profile")}
          className="w-16 h-16 bg-white rounded-full mx-auto mb-3 flex items-center justify-center text-orange-500 font-bold text-xl cursor-pointer hover:opacity-90 transition"
        >
          {user.username.charAt(0).toUpperCase()}
        </div>
        <h1 className="text-xl font-semibold">{user.username}</h1>
      </div>

      {/* Đơn hàng */}
      <div className="bg-white mt-4 rounded-lg shadow mx-3">
        <div className="flex items-center justify-between px-6 py-3 border-b">
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
          <button
            onClick={() => router.push("/customer/pending")}
            className="flex flex-col items-center text-gray-700 hover:text-orange-500"
          >
            <Clock size={28} />
            <span className="text-sm mt-1">
              {translate("waiting_confirm") || "Chờ xác nhận"}
            </span>
          </button>

          <button
            onClick={() => router.push("/customer/pickup")}
            className="flex flex-col items-center text-gray-700 hover:text-orange-500"
          >
            <Package size={28} />
            <span className="text-sm mt-1">
              {translate("waiting_pickup") || "Chờ lấy hàng"}
            </span>
          </button>

          <button
            onClick={() => router.push("/customer/shipping")}
            className="flex flex-col items-center text-gray-700 hover:text-orange-500"
          >
            <Truck size={28} />
            <span className="text-sm mt-1">
              {translate("delivering") || "Đang giao"}
            </span>
          </button>

          <button
            onClick={() => router.push("/customer/review")}
            className="flex flex-col items-center text-gray-700 hover:text-orange-500"
          >
            <Star size={28} />
            <span className="text-sm mt-1">
              {translate("review") || "Đánh giá"}
            </span>
          </button>

          <button
            onClick={handleLogoutPi}
            className="flex flex-col items-center text-red-600 hover:text-red-700"
          >
            <LogOut size={28} />
            <span className="text-sm mt-1">
              {translate("logout") || "Đăng xuất"}
            </span>
          </button>
        </div>
      </div>

      {/* Ví người dùng */}
      <div className="bg-white mx-3 mt-4 p-4 rounded-lg shadow text-center">
        <p className="text-gray-700">
          💰 {translate("wallet_label") || "Ví Pi"}:{" "}
          <b>{user?.wallet_address || "Chưa liên kết"}</b>
        </p>
      </div>
    </div>
  );
}
