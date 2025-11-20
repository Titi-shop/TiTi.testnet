"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from 'next-intl';
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

        {/* Ví Pi */}
        <Link
          href="/seller/wallet"
          className="bg-emerald-500 hover:bg-emerald-600 text-white p-5 rounded-xl shadow-md transition"
        >
          <Wallet size={34} className="mx-auto" />
          <span className="mt-2 font-semibold block">Ví Pi</span>
        </Link>
      </div>
    </main>
  );
}
