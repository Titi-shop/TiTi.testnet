"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";
import { useAuth } from "@/context/AuthContext";
import { PackagePlus, Package, ClipboardList, LogOut } from "lucide-react";

export default function SellerPage() {
  const { user, loading, piReady, logout } = useAuth();
  const { t } = useTranslation();

  const [role, setRole] = useState<"buyer" | "seller" | "admin" | null>(null);
  const [checking, setChecking] = useState(false);

  // 👉 CHỈ LẤY ROLE NẾU ĐÃ LOGIN (KHÔNG CHẶN PAGE)
  useEffect(() => {
    if (!loading && piReady && user) {
      setChecking(true);
      fetch("/api/users/role", { credentials: "include" })
        .then(res => res.json())
        .then(d => {
          if (d?.success) setRole(d.role);
          else setRole("buyer");
        })
        .catch(() => setRole("buyer"))
        .finally(() => setChecking(false));
    }
  }, [loading, piReady, user]);

  const canOperate = role === "seller" || role === "admin";

  // ⏳ chỉ loading auth, KHÔNG chặn page
  if (loading || !piReady) {
    return (
      <p className="text-center mt-10 text-gray-500">⏳ Đang tải...</p>
    );
  }

  return (
    <main className="max-w-3xl mx-auto p-6">
      {/* ===== TITLE ===== */}
      <h1 className="text-xl font-semibold text-gray-700 mb-6">
        Seller Platform
      </h1>

      {/* ===== ACTIONS ===== */}
      <div className="grid grid-cols-3 gap-6 text-center mb-10">
        {/* Post Product */}
        <Link
          href={canOperate ? "/seller/post-product" : "#"}
          className={!canOperate ? "pointer-events-none opacity-40" : "group"}
        >
          <div className="mx-auto w-20 h-20 rounded-full bg-green-100 flex items-center justify-center shadow">
            <PackagePlus className="w-8 h-8 text-gray-700" />
          </div>
          <p className="mt-3 text-sm font-medium text-gray-700">
            Post Product
          </p>
        </Link>

        {/* Stock */}
        <Link
          href={canOperate ? "/seller/stock" : "#"}
          className={!canOperate ? "pointer-events-none opacity-40" : "group"}
        >
          <div className="mx-auto w-20 h-20 rounded-full bg-green-100 flex items-center justify-center shadow">
            <Package className="w-8 h-8 text-gray-700" />
          </div>
          <p className="mt-3 text-sm font-medium text-gray-700">
            Stock
          </p>
        </Link>

        {/* Seller Orders */}
        <Link
          href={canOperate ? "/seller/orders" : "#"}
          className={!canOperate ? "pointer-events-none opacity-40" : "group"}
        >
          <div className="mx-auto w-20 h-20 rounded-full bg-green-100 flex items-center justify-center shadow">
            <ClipboardList className="w-8 h-8 text-gray-700" />
          </div>
          <p className="mt-3 text-sm font-medium text-gray-700">
            Seller Orders
          </p>
        </Link>
      </div>

      {/* ===== LOGOUT (chỉ khi seller/admin) ===== */}
      {user && canOperate && (
        <>
          <hr className="my-6" />
          <button
            onClick={logout}
            className="w-full bg-red-500 hover:bg-red-600 text-white py-4 rounded-xl flex items-center justify-center gap-3 text-lg font-medium shadow"
          >
            <LogOut />
            Logout
          </button>
        </>
      )}
    </main>
  );
}
