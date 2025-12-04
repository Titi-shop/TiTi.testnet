"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";

import { Clock, Package, Truck, Star, RotateCcw } from "lucide-react";
import CustomerMenu from "@/components/customerMenu";

interface MenuButtonProps {
  icon: React.ReactNode;
  label: string;
  path: string;
}

export default function CustomerDashboard() {
  const { user, piReady } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();

  const [avatar, setAvatar] = useState<string | null>(null);

  // 🟢 Load avatar từ API
  useEffect(() => {
    if (!user?.username) return;

    fetch(`/api/getAvatar?username=${encodeURIComponent(user.username)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.avatar) setAvatar(data.avatar);
      })
      .catch(() => console.log("⚠️ Không thể tải avatar"));
  }, [user]);

  // 🛑 Nếu chưa đăng nhập → chuyển sang PiLogin
  useEffect(() => {
    if (piReady && !user) {
      router.replace("/pilogin");
    }
  }, [piReady, user, router]);

  if (!piReady || !user)
    return (
      <main className="min-h-screen flex items-center justify-center text-gray-500">
        ⏳ {t.loading || "Đang tải..."}
      </main>
    );

  return (
    <div className="min-h-screen bg-gray-100 pb-10">

      {/* Header */}
      <div className="bg-orange-500 text-white p-6 text-center shadow">
        <div
          className="w-20 h-20 bg-white rounded-full mx-auto mb-3 overflow-hidden
          flex items-center justify-center text-orange-500 font-bold text-3xl shadow-lg"
        >
          {avatar ? (
            <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            user.username.charAt(0).toUpperCase()
          )}
        </div>

        {/* Username + Verified */}
        <h1 className="text-xl font-semibold flex items-center justify-center gap-2">
          @{user.username} <span className="text-blue-500 text-lg">✔️</span>
        </h1>
      </div>

      {/* Đơn hàng */}
      <div className="bg-white mt-4 rounded-lg shadow mx-3">
        <div className="px-6 py-3 border-b">
          <h2 className="font-semibold text-gray-800 text-lg">
            {t.my_orders || "Đơn mua của bạn"}
          </h2>
        </div>

        <div className="grid grid-cols-5 text-center py-4">
          <MenuButton icon={<Clock size={28} />} label={t.pending_orders || "Chờ xác nhận"} path="/customer/pending" />
          <MenuButton icon={<Package size={28} />} label={t.pickup_orders || "Chờ lấy hàng"} path="/customer/pickup" />
          <MenuButton icon={<Truck size={28} />} label={t.shipping_orders || "Đang giao"} path="/customer/shipping" />
          <MenuButton icon={<Star size={28} />} label={t.review_orders || "Đánh giá"} path="/customer/review" />
          <MenuButton icon={<RotateCcw size={28} />} label={t.return_orders || "Trả hàng"} path="/customer/returns" />
        </div>
      </div>

      {/* Ví Pi */}
      <div className="mx-3 mt-4 p-4 rounded-lg text-center bg-orange-100 border border-orange-300">
        <p className="text-orange-700 font-medium">
          💰 {t.wallet || "Ví của bạn"}:{" "}
          <span className="font-bold">
            {user?.wallet_address || t.link_wallet || "Chưa liên kết"}
          </span>
        </p>
      </div>

      {/* Menu footer */}
      <CustomerMenu />
    </div>
  );
}

/* 🔹 MenuButton Component (không dùng any, giữ nguyên UI) */
function MenuButton({ icon, label, path }: MenuButtonProps) {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push(path)}
      className="flex flex-col items-center text-gray-700 hover:text-orange-500"
    >
      {icon}
      <span className="text-sm mt-1">{label}</span>
    </button>
  );
}
