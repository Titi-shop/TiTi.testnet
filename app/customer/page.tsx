"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/app/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { Clock, Package, Truck, Star, LogOut, User } from "lucide-react";

export default function CustomerDashboard() {
  const { user, logout, piReady } = useAuth();
  const { translate } = useLanguage();
  const router = useRouter();

  // ✅ Nếu chưa đăng nhập → chuyển về /pilogin
  useEffect(() => {
    if (piReady && !user) {
      router.replace("/pilogin");
    }
  }, [piReady, user, router]);

  // 🚫 Khi chưa có user → hiển thị chờ hoặc nhắc đăng nhập
  if (!user)
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-gray-100 text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-3">
          🔐 {translate("login_required") || "Vui lòng đăng nhập bằng Pi Network để tiếp tục"}
        </h2>
        <button
          onClick={() => router.push("/pilogin")}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded"
        >
          👉 {translate("go_to_login") || "Đăng nhập ngay"}
        </button>
      </main>
    );

  // ✅ Hàm đăng xuất đồng bộ
  const handleLogoutPi = async () => {
    try {
      if (typeof window !== "undefined" && window.Pi?.logout) {
        await window.Pi.logout();
        console.log("✅ Đã đăng xuất khỏi Pi Network");
      }
    } catch (err) {
      console.error("⚠️ Lỗi logout Pi:", err);
    } finally {
      logout(); // dùng hàm context
      router.replace("/pilogin");
    }
  };

  // ✅ Nếu đã đăng nhập
  return (
    <div className="min-h-screen bg-gray-100">
      {/* ===== Thông tin người dùng ===== */}
      <div className="bg-orange-500 text-white p-6 text-center shadow relative">
        <div
          className="flex flex-col items-center justify-center cursor-pointer hover:opacity-90 transition"
          onClick={() => router.push("/customer/profile")}
        >
          <div className="w-16 h-16 bg-white rounded-full mb-3 flex items-center justify-center text-orange-500 font-bold text-xl">
            {user.username.charAt(0).toUpperCase()}
          </div>
          <h1 className="text-xl font-semibold">{user.username}</h1>
          <p className="text-sm opacity-90 mt-1">
            {translate("customer_title") || "Khách hàng TiTi Mall"}
          </p>

          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push("/customer/profile");
            }}
            className="mt-3 bg-white text-orange-600 text-sm px-4 py-1 rounded-full flex items-center gap-1 hover:bg-gray-100 transition"
          >
            <User size={16} />
            {translate("account") || "Tài khoản"}
          </button>
        </div>
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
