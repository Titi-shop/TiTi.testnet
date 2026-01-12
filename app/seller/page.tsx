"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { PackagePlus, Package, ClipboardList, LogOut } from "lucide-react";

export default function SellerPage() {
  const { user, loading, piReady, logout } = useAuth();

  // 🔐 CHỈ USER NÀY ĐƯỢC THAO TÁC
  const canOperate = user?.username === "nguyenminhduc1991111","TranYenNhi1611";

  if (loading || !piReady) {
    return (
      <p className="text-center mt-10 text-gray-500">⏳ Đang tải...</p>
    );
  }

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-xl font-semibold text-gray-700 mb-6">
        Seller Platform
      </h1>

      <div className="grid grid-cols-3 gap-6 text-center mb-10">
        {/* Post Product */}
        <Link
          href={canOperate ? "/seller/post" : "#"}
          className={!canOperate ? "pointer-events-none opacity-40" : ""}
        >
          <div className="mx-auto w-20 h-20 rounded-full bg-green-100 flex items-center justify-center shadow">
            <PackagePlus className="w-8 h-8 text-gray-700" />
          </div>
          <p className="mt-3 text-sm font-medium">Post Product</p>
        </Link>

        {/* Stock */}
        <Link
          href={canOperate ? "/seller/stock" : "#"}
          className={!canOperate ? "pointer-events-none opacity-40" : ""}
        >
          <div className="mx-auto w-20 h-20 rounded-full bg-green-100 flex items-center justify-center shadow">
            <Package className="w-8 h-8 text-gray-700" />
          </div>
          <p className="mt-3 text-sm font-medium">Stock</p>
        </Link>

        {/* Orders */}
        <Link
          href={canOperate ? "/seller/orders" : "#"}
          className={!canOperate ? "pointer-events-none opacity-40" : ""}
        >
          <div className="mx-auto w-20 h-20 rounded-full bg-green-100 flex items-center justify-center shadow">
            <ClipboardList className="w-8 h-8 text-gray-700" />
          </div>
          <p className="mt-3 text-sm font-medium">Seller Orders</p>
        </Link>
      </div>

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
