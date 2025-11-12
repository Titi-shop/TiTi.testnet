"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "../context/LanguageContext";
import {
  PackagePlus,
  Package,
  ClipboardList,
  Wallet,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function SellerDashboard() {
  const { translate } = useLanguage();
  const { user, piReady } = useAuth();
  const router = useRouter();

  const [isSeller, setIsSeller] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Nếu Pi chưa sẵn sàng thì chờ
    if (!piReady) return;

    // Nếu chưa có user thì quay về trang tìm kiếm
    if (!user) {
      router.replace("/search");
      return;
    }

    // ✅ Kiểm tra quyền thật sự của user
    const verifyRole = async () => {
      try {
        const res = await fetch(`/api/users/role?username=${user.username}`);
        const data = await res.json();

        if (data.role === "seller") {
          setIsSeller(true);
        } else {
          // Nếu không phải seller → quay về /search
          router.replace("/search");
        }
      } catch (error) {
        console.error("❌ Lỗi kiểm tra role:", error);
        router.replace("/search");
      } finally {
        setChecking(false);
      }
    };

    verifyRole();
  }, [piReady, user, router]);

  // Loading trong khi kiểm tra quyền
  if (!piReady || checking) {
    return (
      <main className="flex items-center justify-center min-h-screen text-gray-500">
        ⏳ Đang kiểm tra quyền truy cập...
      </main>
    );
  }

  // ❌ Không phải seller thì không render gì thêm
  if (!isSeller) return null;

  // ✅ Giao diện chỉ hiển thị cho Seller
  return (
    <main className="p-6 pb-24 max-w-6xl mx-auto">
      <div className="text-right text-sm text-gray-700 mb-4">
        👤 {translate("seller_label") || "Người bán"}:{" "}
        <b>{user?.username}</b>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5 text-center mt-2">
        {/* Đăng sản phẩm */}
        <Link
          href="/seller/post"
          className="bg-amber-500 hover:bg-amber-600 text-white p-6 rounded-lg shadow hover:shadow-lg transition-transform hover:scale-105"
        >
          <PackagePlus size={36} className="mx-auto mb-2" />
          <span className="font-semibold block">
            📦 {translate("post_product") || "Đăng sản phẩm"}
          </span>
        </Link>

        {/* Kho hàng */}
        <Link
          href="/seller/stock"
          className="bg-blue-500 hover:bg-blue-600 text-white p-6 rounded-lg shadow hover:shadow-lg transition-transform hover:scale-105"
        >
          <Package size={36} className="mx-auto mb-2" />
          <span className="font-semibold block">
            🏬 {translate("manage_stock") || "Kho hàng"}
          </span>
        </Link>

        {/* Xử lý đơn */}
        <Link
          href="/seller/orders"
          className="bg-green-500 hover:bg-green-600 text-white p-6 rounded-lg shadow hover:shadow-lg transition-transform hover:scale-105"
        >
          <ClipboardList size={36} className="mx-auto mb-2" />
          <span className="font-semibold block">
            🧾 {translate("process_orders") || "Xử lý đơn"}
          </span>
        </Link>

        {/* Ví Pi */}
        <Link
          href="/seller/wallet"
          className="bg-emerald-500 hover:bg-emerald-600 text-white p-6 rounded-lg shadow hover:shadow-lg transition-transform hover:scale-105"
        >
          <Wallet size={36} className="mx-auto mb-2" />
          <span className="font-semibold block">
            💰 {translate("wallet") || "Ví Pi"}
          </span>
        </Link>
      </div>
    </main>
  );
}
