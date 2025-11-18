"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "@/context/AuthContext";

import { PackagePlus, Package, ClipboardList, Wallet } from "lucide-react";

export default function SellerDashboard() {
  const router = useRouter();
  const { translate } = useLanguage();
  const { user, loading, piReady } = useAuth();

  const [role, setRole] = useState<string>("");
  const [checking, setChecking] = useState(true);

  /* ============================================
     🔐 KIỂM TRA ĐĂNG NHẬP & ROLE SELLER
  ============================================ */
  useEffect(() => {
    if (!loading && piReady) {
      if (!user) {
        router.push("/search");   // ⭐ CHUYỂN HƯỚNG KHI CHƯA ĐĂNG NHẬP
        return;
      }

      const username = user.username;

      fetch(`/api/users/role?username=${username}`)
        .then((r) => r.json())
        .then((d) => {
          setRole(d.role);
          if (d.role !== "seller") {
            router.push("/no-access");
          }
        })
        .finally(() => setChecking(false));
    }
  }, [loading, piReady, user, router]);

  /* ============================================
     ⏳ LOADING
  ============================================ */
  if (checking || loading || !piReady)
    return (
      <main className="flex items-center justify-center h-screen text-gray-500">
        ⏳ Đang tải...
      </main>
    );

  if (!user || role !== "seller") return null;

  /* ============================================
     🎨 UI DASHBOARD SELLER
  ============================================ */
  return (
    <main className="p-6 pb-24 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-center mb-3 text-orange-600">
        🛒 Kênh Người Bán
      </h1>

      <p className="text-center text-gray-500 mb-6 text-sm">
        👤 Người bán: <b>{user.username}</b>
      </p>

      {/* GRID ICON 4 MỤC */}
      <div className="grid grid-cols-2 gap-5 text-center">

        {/* Đăng sản phẩm */}
        <Link
          href="/seller/post"
          className="bg-amber-500 hover:bg-amber-600 text-white p-5 rounded-xl shadow-md transition"
        >
          <PackagePlus size={34} className="mx-auto" />
          <span className="mt-2 font-semibold block">Đăng sản phẩm</span>
        </Link>

        {/* Kho hàng */}
        <Link
          href="/seller/stock"
          className="bg-blue-500 hover:bg-blue-600 text-white p-5 rounded-xl shadow-md transition"
        >
          <Package size={34} className="mx-auto" />
          <span className="mt-2 font-semibold block">Kho hàng</span>
        </Link>

        {/* Đơn hàng */}
        <Link
          href="/seller/orders"
          className="bg-green-500 hover:bg-green-600 text-white p-5 rounded-xl shadow-md transition"
        >
          <ClipboardList size={34} className="mx-auto" />
          <span className="mt-2 font-semibold block">Đơn hàng</span>
        </Link>

        {/* Ví Pi Network */}
<div className="bg-white mx-3 mt-4 p-4 rounded-lg shadow text-center">
  <p className="text-gray-700">
    💰 {translate("wallet_label") || "Ví Pi"}:{" "}
    <b>{user?.wallet_address || "Chưa liên kết"}</b>
  </p>
</div>

{/* 🟠 Menu dưới cùng */}
<CustomerMenu />
        </Link>
      </div>
    </main>
  );
}
