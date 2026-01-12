"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";
import { useAuth } from "@/context/AuthContext";

import { PackagePlus, Package, ClipboardList, LogOut } from "lucide-react";

export default function SellerPage() {
  const router = useRouter();
  const { user, loading, piReady, logout } = useAuth();
  const { t } = useTranslation();

  const [role, setRole] = useState<"buyer" | "seller" | "admin" | null>(null);
  const [checking, setChecking] = useState(true);

  // 🔐 CHECK ROLE (ĐÚNG API – KHÔNG query username)
  useEffect(() => {
    if (!loading && piReady && user) {
      (async () => {
        try {
          const res = await fetch("/api/users/role", {
            credentials: "include",
          });
          const d = await res.json();

          if (!d.success) {
            router.replace("/no-access");
            return;
          }

          setRole(d.role);

          if (d.role !== "seller" && d.role !== "admin") {
            router.replace("/no-access");
          }
        } finally {
          setChecking(false);
        }
      })();
    }
  }, [loading, piReady, user, router]);

  if (checking || loading || !piReady) {
    return (
      <p className="text-center mt-10 text-gray-500">⏳ Đang tải...</p>
    );
  }

  if (!user || (role !== "seller" && role !== "admin")) return null;

  return (
    <main className="max-w-3xl mx-auto p-6">
      {/* ===== TITLE ===== */}
      <h1 className="text-xl font-semibold text-gray-700 mb-6">
        Seller Platform
      </h1>

      {/* ===== ACTIONS ===== */}
      <div className="grid grid-cols-3 gap-6 text-center mb-10">
        {/* Post Product */}
        <Link href="/seller/post-product" className="group">
          <div className="mx-auto w-20 h-20 rounded-full bg-green-100 flex items-center justify-center shadow group-hover:scale-105 transition">
            <PackagePlus className="w-8 h-8 text-gray-700" />
          </div>
          <p className="mt-3 text-sm font-medium text-gray-700">
            Post Product
          </p>
        </Link>

        {/* Stock */}
        <Link href="/seller/stock" className="group">
          <div className="mx-auto w-20 h-20 rounded-full bg-green-100 flex items-center justify-center shadow group-hover:scale-105 transition">
            <Package className="w-8 h-8 text-gray-700" />
          </div>
          <p className="mt-3 text-sm font-medium text-gray-700">
            Stock
          </p>
        </Link>

        {/* Seller Orders */}
        <Link href="/seller/orders" className="group">
          <div className="mx-auto w-20 h-20 rounded-full bg-green-100 flex items-center justify-center shadow group-hover:scale-105 transition">
            <ClipboardList className="w-8 h-8 text-gray-700" />
          </div>
          <p className="mt-3 text-sm font-medium text-gray-700">
            Seller Orders
          </p>
        </Link>
      </div>

      <hr className="my-6" />

      {/* ===== LOGOUT ===== */}
      <button
        onClick={logout}
        className="w-full bg-red-500 hover:bg-red-600 text-white py-4 rounded-xl flex items-center justify-center gap-3 text-lg font-medium shadow"
      >
        <LogOut />
        Logout
      </button>
    </main>
  );
}
