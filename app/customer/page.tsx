"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/app/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { Clock, Package, Truck, Star, RotateCcw } from "lucide-react";
import CustomerMenu from "@/components/customerMenu";

export default function CustomerDashboard() {
  const { user, piReady } = useAuth();
  const { translate } = useLanguage();
  const router = useRouter();

  const [avatar, setAvatar] = useState<string | null>(null);

  // 🟢 Lấy avatar từ API
  useEffect(() => {
    if (!user?.username) return;

    fetch(`/api/getAvatar?username=${encodeURIComponent(user.username)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.avatar) setAvatar(data.avatar);
      })
      .catch(() => console.log("⚠️ Không thể tải avatar"));
  }, [user]);

  // 🛑 Chưa login → chuyển PiLogin
  useEffect(() => {
    if (piReady && !user) {
      router.replace("/pilogin");
    }
  }, [piReady, user, router]);

  if (!piReady || !user)
    return (
      <main className="min-h-screen flex items-center justify-center text-gray-500">
        ⏳ Đang tải...
      </main>
    );

  return (
    <div className="min-h-screen bg-gray-100 pb-10">

      {/* Header */}
      <div className="bg-orange-500 text-white p-6 text-center shadow">

        {/* Avatar - chỉ hiển thị hình hoặc chữ cái, KHÔNG click */}
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

        {/* 🟢 Username + Huy hiệu xác minh */}
<h1 className="text-xl font-semibold flex items-center justify-center gap-2">
  @{user.username}
  <span className="text-blue-500 text-lg">✔️</span>
</h1>
      </div>

      {/* Đơn hàng */}
      <div className="bg-white mt-4 rounded-lg shadow mx-3">
        <div className="px-6 py-3 border-b">
          <h2 className="font-semibold text-gray-800 text-lg">
            {translate("my_orders") || "Đơn mua của bạn"}
          </h2>
        </div>

        <div className="grid grid-cols-5 text-center py-4">
          <MenuButton icon={<Clock size={28} />} label="Chờ xác nhận" path="/customer/pending" />
          <MenuButton icon={<Package size={28} />} label="Chờ lấy hàng" path="/customer/pickup" />
          <MenuButton icon={<Truck size={28} />} label="Đang giao" path="/customer/shipping" />
          <MenuButton icon={<Star size={28} />} label="Đánh giá" path="/customer/review" />
          <MenuButton icon={<RotateCcw size={28} />} label="Trả hàng" path="/customer/returns" />
        </div>
      </div>

      {/* Ví Pi – giao diện màu cam */}
      <div className="mx-3 mt-4 p-4 rounded-lg text-center bg-orange-100 border border-orange-300">
        <p className="text-orange-700 font-medium">
          💰 Ví của bạn:{" "}
          <span className="font-bold">
            {user?.wallet_address || "Chưa liên kết"}
          </span>
        </p>
      </div>

      {/* Menu footer */}
      <CustomerMenu />
    </div>
  );
}

/* Component MenuButton để giảm code lặp */
function MenuButton({ icon, label, path }: any) {
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
