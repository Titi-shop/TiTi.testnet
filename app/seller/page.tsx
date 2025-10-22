"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "../context/LanguageContext";
import {
  PackagePlus,
  Package,
  ClipboardList,
  RefreshCcw,
  Truck,
  Wallet,
} from "lucide-react";

export default function SellerDashboard() {
  const { translate } = useLanguage();
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [sellerUser, setSellerUser] = useState<string>("");

  // ✅ Kiểm tra trạng thái đăng nhập Pi
  useEffect(() => {
    try {
      const stored = localStorage.getItem("pi_user");
      const logged = localStorage.getItem("titi_is_logged_in");
      if (stored && logged === "true") {
        const parsed = JSON.parse(stored);
        const username = parsed?.user?.username || parsed?.username || "guest_user";
        setSellerUser(username);
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
      }
    } catch (err) {
      console.error("❌ Lỗi đọc thông tin đăng nhập:", err);
      setIsLoggedIn(false);
    }
  }, []);

  // 🚫 Nếu chưa đăng nhập → chuyển hướng về PiLogin
  if (!isLoggedIn)
    return (
      <main className="p-6 text-center">
        <h2 className="text-xl font-bold text-red-600 mb-3">
          🔐 {translate("login_required") || "Vui lòng đăng nhập bằng Pi Network để truy cập khu vực Người Bán"}
        </h2>
        <button
          onClick={() => router.push("/pilogin")}
          className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          👉 {translate("go_to_login") || "Đăng nhập ngay"}
        </button>
      </main>
    );

  // ✅ Nếu đã đăng nhập
  return (
    <main className="p-6 max-w-6xl mx-auto">
      {/* ===== Tiêu đề ===== */}
      <div className="bg-yellow-400 text-white text-xl font-bold p-3 rounded-t-lg mb-4 flex justify-between items-center shadow">
        <span>👑 {translate("seller_dashboard") || "Khu vực Người Bán"}</span>
        <span className="text-sm bg-white text-yellow-700 px-3 py-1 rounded shadow">
          👤 {translate("seller_label") || "Người bán"}: <b>{sellerUser}</b>
        </span>
      </div>

      {/* ===== Các mục quản lý ===== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-5 text-center">
        <Link
          href="/seller/post"
          className="bg-amber-500 hover:bg-amber-600 text-white p-6 rounded-lg shadow flex flex-col items-center transition transform hover:scale-105"
        >
          <PackagePlus size={36} />
          <span className="mt-2 font-semibold">
            📦 {translate("post_product") || "Đăng sản phẩm"}
          </span>
        </Link>

        <Link
          href="/seller/stock"
          className="bg-blue-500 hover:bg-blue-600 text-white p-6 rounded-lg shadow flex flex-col items-center transition transform hover:scale-105"
        >
          <Package size={36} />
          <span className="mt-2 font-semibold">
            🏬 {translate("manage_stock") || "Kho hàng"}
          </span>
        </Link>

        <Link
          href="/seller/orders"
          className="bg-green-500 hover:bg-green-600 text-white p-6 rounded-lg shadow flex flex-col items-center transition transform hover:scale-105"
        >
          <ClipboardList size={36} />
          <span className="mt-2 font-semibold">
            🧾 {translate("process_orders") || "Xử lý đơn"}
          </span>
        </Link>

        <Link
          href="/seller/status"
          className="bg-purple-500 hover:bg-purple-600 text-white p-6 rounded-lg shadow flex flex-col items-center transition transform hover:scale-105"
        >
          <RefreshCcw size={36} />
          <span className="mt-2 font-semibold">
            📊 {translate("update_status") || "Cập nhật trạng thái"}
          </span>
        </Link>

        <Link
          href="/seller/delivery"
          className="bg-orange-500 hover:bg-orange-600 text-white p-6 rounded-lg shadow flex flex-col items-center transition transform hover:scale-105"
        >
          <Truck size={36} />
          <span className="mt-2 font-semibold">
            🚚 {translate("delivery") || "Giao hàng"}
          </span>
        </Link>

        <Link
          href="/seller/wallet"
          className="bg-emerald-500 hover:bg-emerald-600 text-white p-6 rounded-lg shadow flex flex-col items-center transition transform hover:scale-105"
        >
          <Wallet size={36} />
          <span className="mt-2 font-semibold">
            💰 {translate("wallet") || "Ví Pi"}
          </span>
        </Link>
      </div>

      {/* ===== Nút đăng xuất ===== */}
      <div className="text-center mt-8">
        <button
          onClick={() => {
            localStorage.removeItem("pi_user");
            localStorage.removeItem("titi_is_logged_in");
            router.push("/pilogin");
          }}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
        >
          🚪 {translate("logout") || "Đăng xuất"}
        </button>
      </div>
    </main>
  );
}
