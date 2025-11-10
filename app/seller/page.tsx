"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
  const [sellerUser, setSellerUser] = useState<string>("");
  const [isSeller, setIsSeller] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const verifyAccess = async () => {
      try {
        const stored = localStorage.getItem("pi_user");
        const logged = localStorage.getItem("titi_is_logged_in");

        // ❌ Nếu chưa đăng nhập → chuyển hướng đến trang tìm kiếm
        if (!stored || logged !== "true") return router.replace("/search");

        const username =
          JSON.parse(stored)?.user?.username ||
          JSON.parse(stored)?.username ||
          "guest_user";
        setSellerUser(username);

        // ✅ Kiểm tra quyền người bán
        const res = await fetch(`/api/users/role?username=${username}`);
        const data = await res.json();

        if (data?.role === "seller") setIsSeller(true);
        else router.replace("/search");
      } catch {
        router.replace("/search");
      } finally {
        setIsChecking(false);
      }
    };

    verifyAccess();
  }, [router]);

  // 🕓 Khi đang kiểm tra quyền
  if (isChecking) {
    return (
      <main className="flex items-center justify-center min-h-screen text-gray-500">
        ⏳ {translate("checking_access") || "Đang kiểm tra quyền truy cập..."}
      </main>
    );
  }

  // ❌ Nếu không phải người bán (đã redirect nhưng thêm chặn dự phòng)
  if (!isSeller) return null;

  // ✅ Khi là người bán
  return (
    <main className="p-6 pb-24 max-w-6xl mx-auto">
      <div className="text-right text-sm text-gray-700 mb-4">
        👤 {translate("seller_label") || "Người bán"}: <b>{sellerUser}</b>
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
