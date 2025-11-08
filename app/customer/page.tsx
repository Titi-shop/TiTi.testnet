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

  // ✅ Nếu chưa đăng nhập thì chuyển sang /pilogin
  useEffect(() => {
    if (piReady && !user) {
      router.replace("/pilogin");
    }
  }, [piReady, user, router]);

  if (!piReady || !user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-500">
        ⏳ Đang tải...
      </main>
    );
  }

  // ✅ Hàm đăng xuất khỏi Pi
  const handleLogoutPi = async () => {
    try {
      if (typeof window !== "undefined" && window.Pi?.logout) {
        await window.Pi.logout();
        console.log("✅ Đã đăng xuất khỏi Pi Network");
      }
    } catch (err) {
      console.error("⚠️ Lỗi logout Pi:", err);
    } finally {
      logout();
      router.replace("/pilogin");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-10">
      {/* ===== Header (khung cam) ===== */}
      <div className="bg-orange-500 text-white p-6 text-center shadow relative flex flex-col items-center justify-center">
        {/* ✅ Avatar — chỉ click được vào vòng tròn này */}
        <div
          onClick={() => router.push("/customer/profile")}
          className="w-16 h-16 bg-white rounded-full mb-3 flex items-center justify-center text-orange-500 font-bold text-xl cursor-pointer hover:opacity-90 transition"
        >
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt="Avatar"
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            user.username.charAt(0).toUpperCase()
          )}
        </div>

        {/* ✅ Tên người dùng */}
        <h1 className="text-xl font-semibold select-none">
          {user.username}
        </h1>
      </div>

      {/* ===== Thanh công cụ đơn hàng ===== */}
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

        {/* ===== Các trạng thái đơn hàng ===== */}
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

      {/* ===== Ví người dùng ===== */}
      <div className="bg-white mx-3 mt-4 p-4 rounded-lg shadow text-center">
        <p className="text-gray-700">
          💰 {translate("wallet_label") || "Ví Pi"}:{" "}
          <b>{user?.wallet_address || "Chưa liên kết"}</b>
        </p>
      </div>
    </div>
  );
}
