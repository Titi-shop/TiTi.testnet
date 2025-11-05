"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
  const [sellerUser, setSellerUser] = useState<string>("");
  const [isSeller, setIsSeller] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const checkSeller = async () => {
      try {
        const stored = localStorage.getItem("pi_user");
        const logged = localStorage.getItem("titi_is_logged_in");

        if (!stored || logged !== "true") {
          setChecked(true);
          return;
        }

        const parsed = JSON.parse(stored);
        const username =
          parsed?.user?.username || parsed?.username || "guest_user";
        setSellerUser(username);

        const res = await fetch(`/api/users/role?username=${username}`);
        const data = await res.json();

        if (data?.role === "seller") {
          setIsSeller(true);
        }
      } catch (err) {
        console.error("❌ Lỗi xác thực:", err);
      } finally {
        setChecked(true);
      }
    };

    checkSeller();
  }, []);

  // ❗ Chỉ hiển thị nội dung khi đã kiểm tra xong
  if (!checked) {
    return null;
  }

  // ❗ Nếu không phải người bán — hiển thị trống (không báo lỗi, không redirect)
  if (!isSeller) {
    return null;
  }

  // ✅ Người bán hợp lệ — hiển thị dashboard
  return (
    <main className="p-6 pb-24 max-w-6xl mx-auto">
      <div className="text-right text-sm text-gray-700 mb-4">
        👤 Người bán: <b>{sellerUser}</b>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-5 text-center mt-2">
        <Link
          href="/seller/post"
          className="bg-amber-500 hover:bg-amber-600 text-white p-6 rounded-lg shadow transition"
        >
          <PackagePlus size={36} />
          <span className="mt-2 font-semibold block">📦 Đăng sản phẩm</span>
        </Link>

        <Link
          href="/seller/stock"
          className="bg-blue-500 hover:bg-blue-600 text-white p-6 rounded-lg shadow transition"
        >
          <Package size={36} />
          <span className="mt-2 font-semibold block">🏬 Kho hàng</span>
        </Link>

        <Link
          href="/seller/orders"
          className="bg-green-500 hover:bg-green-600 text-white p-6 rounded-lg shadow transition"
        >
          <ClipboardList size={36} />
          <span className="mt-2 font-semibold block">🧾 Xử lý đơn</span>
        </Link>

        <Link
          href="/seller/status"
          className="bg-purple-500 hover:bg-purple-600 text-white p-6 rounded-lg shadow transition"
        >
          <RefreshCcw size={36} />
          <span className="mt-2 font-semibold block">📊 Trạng thái</span>
        </Link>

        <Link
          href="/seller/delivery"
          className="bg-orange-500 hover:bg-orange-600 text-white p-6 rounded-lg shadow transition"
        >
          <Truck size={36} />
          <span className="mt-2 font-semibold block">🚚 Giao hàng</span>
        </Link>

        <Link
          href="/seller/wallet"
          className="bg-emerald-500 hover:bg-emerald-600 text-white p-6 rounded-lg shadow transition"
        >
          <Wallet size={36} />
          <span className="mt-2 font-semibold block">💰 Ví Pi</span>
        </Link>
      </div>
    </main>
  );
}
