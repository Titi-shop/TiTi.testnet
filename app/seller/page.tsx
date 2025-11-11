"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
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
  const { user, piReady } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!piReady) return;
    if (!user) return router.replace("/pilogin");

    const checkRole = async () => {
      const res = await fetch(`/api/users/role?username=${user.username}`);
      const data = await res.json();
      if (data.role !== "seller") router.replace("/customer");
    };
    checkRole();
  }, [piReady, user, router]);

  if (!piReady || !user)
    return (
      <main className="flex items-center justify-center min-h-screen text-gray-500">
        ⏳ Đang kiểm tra quyền...
      </main>
    );

  return (
    <main className="p-6 pb-24 max-w-6xl mx-auto">
      <div className="text-right text-sm text-gray-700 mb-4">
        👤 {translate("seller_label") || "Người bán"}: <b>{user.username}</b>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-5 text-center mt-2">
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
