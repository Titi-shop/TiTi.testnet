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
  const [role, setRole] = useState<string>("buyer");
  const [loading, setLoading] = useState(true);

  // ✅ Kiểm tra quyền truy cập
  useEffect(() => {
    async function checkAccess() {
      try {
        const stored = localStorage.getItem("pi_user");
        const logged = localStorage.getItem("titi_is_logged_in");

        if (!stored || logged !== "true") {
          setIsLoggedIn(false);
          router.push("/pilogin");
          return;
        }

        const parsed = JSON.parse(stored);
        const username =
          parsed?.user?.username || parsed?.username || "guest_user";

        setSellerUser(username);
        setIsLoggedIn(true);

        // 🔹 Gọi API kiểm tra quyền động
        const res = await fetch(`/api/users/role?username=${username}`);
        const data = await res.json();

        if (data?.role === "seller") {
          setRole("seller");
        } else {
          alert("🚫 Bạn không có quyền truy cập khu vực Người Bán!");
          router.push("/customer");
        }
      } catch (err) {
        console.error("❌ Lỗi xác thực:", err);
        router.push("/pilogin");
      } finally {
        setLoading(false);
      }
    }

    checkAccess();
  }, [router]);

  if (loading) {
    return (
      <main className="p-6 text-center">
        <h2 className="text-xl font-semibold text-gray-600">
          ⏳ Đang xác thực tài khoản...
        </h2>
      </main>
    );
  }

  if (!isLoggedIn || role !== "seller") {
    return (
      <main className="p-6 text-center">
        <h2 className="text-xl font-bold text-red-600 mb-3">
          🔐 {translate("login_required") ||
            "Vui lòng đăng nhập để truy cập khu vực Người Bán"}
        </h2>
        <button
          onClick={() => router.push("/pilogin")}
          className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          👉 {translate("go_to_login") || "Đăng nhập ngay"}
        </button>
      </main>
    );
  }

  return (
    <main className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-yellow-400 text-white text-xl font-bold p-3 rounded-t-lg mb-4 flex justify-between items-center shadow">
        <span>👑 {translate("seller_dashboard") || "Khu vực Người Bán"}</span>
        <span className="text-sm bg-white text-yellow-700 px-3 py-1 rounded shadow">
          👤 {translate("seller_label") || "Người bán"}: <b>{sellerUser}</b>
        </span>
      </div>

      {/* Danh mục chức năng */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-5 text-center">
        <Link
          href="/seller/post"
          className="bg-amber-500 hover:bg-amber-600 text-white p-6 rounded-lg shadow transition"
        >
          <PackagePlus size={36} />
          <span className="mt-2 font-semibold block">
            📦 {translate("post_product") || "Đăng sản phẩm"}
          </span>
        </Link>

        <Link
          href="/seller/stock"
          className="bg-blue-500 hover:bg-blue-600 text-white p-6 rounded-lg shadow transition"
        >
          <Package size={36} />
          <span className="mt-2 font-semibold block">
            🏬 {translate("manage_stock") || "Kho hàng"}
          </span>
        </Link>

        <Link
          href="/seller/orders"
          className="bg-green-500 hover:bg-green-600 text-white p-6 rounded-lg shadow transition"
        >
          <ClipboardList size={36} />
          <span className="mt-2 font-semibold block">
            🧾 {translate("process_orders") || "Xử lý đơn"}
          </span>
        </Link>

        <Link
          href="/seller/status"
          className="bg-purple-500 hover:bg-purple-600 text-white p-6 rounded-lg shadow transition"
        >
          <RefreshCcw size={36} />
          <span className="mt-2 font-semibold block">
            📊 {translate("update_status") || "Cập nhật trạng thái"}
          </span>
        </Link>

        <Link
          href="/seller/delivery"
          className="bg-orange-500 hover:bg-orange-600 text-white p-6 rounded-lg shadow transition"
        >
          <Truck size={36} />
          <span className="mt-2 font-semibold block">
            🚚 {translate("delivery") || "Giao hàng"}
          </span>
        </Link>
<Link
  href="/seller/wallet"
  className="bg-emerald-500 hover:bg-emerald-600 text-white p-6 rounded-lg shadow transition"
>
  <Wallet size={36} />
  <span className="mt-2 font-semibold block">
    💰 {translate("wallet") || "Ví Pi"}
  </span>
</Link>
</div>

</main>
);
}
