"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";
import {
  Clock,
  Package,
  Truck,
  Star,
  RotateCcw,
} from "lucide-react";
import CustomerMenu from "@/components/customerMenu";

export default function AccountPage() {
  const router = useRouter();
  const { user, piReady } = useAuth();
  const { t } = useTranslation();
  const [avatar, setAvatar] = useState<string | null>(null);

  // Nếu chưa đăng nhập → pilogin
  useEffect(() => {
    if (piReady && !user) {
      router.replace("/pilogin");
    }
  }, [piReady, user, router]);

  // Lấy avatar
  useEffect(() => {
    if (!user?.username) return;

    fetch(`/api/getAvatar?username=${encodeURIComponent(user.username)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.avatar) setAvatar(data.avatar);
      })
      .catch(() => {});
  }, [user]);

  if (!user)
    return (
      <main className="min-h-screen flex items-center justify-center text-gray-500">
        Loading...
      </main>
    );

  return (
    <main className="bg-gray-100 min-h-screen pb-20">

      {/* 🔶 HEADER GIỐNG ẢNH */}
      <div className="bg-orange-500 p-6 text-white text-center shadow">
        <div className="relative flex flex-col items-center">

          {/* Avatar */}
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-orange-600 text-4xl shadow-md overflow-hidden">
            {avatar ? (
              <img src={avatar} className="w-full h-full object-cover" />
            ) : (
              user.username.charAt(0).toUpperCase()
            )}
          </div>

          {/* Username */}
          <p className="mt-3 text-lg font-semibold flex items-center gap-1">
            @{user.username}
            <span className="text-blue-300 text-xl">✔</span>
          </p>
        </div>
      </div>

      {/* 🧾 My Orders */}
      <section className="bg-white mx-4 mt-4 rounded-lg shadow">
        <div className="px-5 py-3 border-b">
          <h2 className="text-lg font-semibold text-gray-800">
            {t.my_orders || "My Orders"}
          </h2>
        </div>

        <div className="grid grid-cols-5 text-center py-4">
          <OrderButton 
            icon={<Clock size={26} />} 
            label={t.pending_orders || "Pending Orders"}
            path="/customer/pending"
          />

          <OrderButton 
            icon={<Package size={26} />} 
            label={t.pickup_orders || "Pickup Orders"}
            path="/customer/pickup"
          />

          <OrderButton 
            icon={<Truck size={26} />} 
            label={t.shipping_orders || "Shipping Orders"}
            path="/customer/shipping"
          />

          <OrderButton 
            icon={<Star size={26} />} 
            label={t.review_orders || "Reviews"}
            path="/customer/review"
          />

          <OrderButton 
            icon={<RotateCcw size={26} />} 
            label={t.return_orders || "Return Orders"}
            path="/customer/returns"
          />
        </div>
      </section>

      {/* 💰 PI WALLET */}
      <section className="mx-4 mt-4 p-4 bg-orange-100 border border-orange-300 rounded-lg text-center">
        <p className="text-orange-700 font-medium">
          💰 Pi Wallet:{" "}
          <span className="font-bold text-orange-700">
            {user.wallet_address || t.link_wallet || "Link Wallet"}
          </span>
        </p>
      </section>

      {/* 🔽 CUSTOMER MENU (PHẦN DƯỚI GIỐNG ẢNH) */}
      <CustomerMenu />

    </main>
  );
}

function OrderButton({
  icon,
  label,
  path,
}: {
  icon: React.ReactNode;
  label: string;
  path: string;
}) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push(path)}
      className="flex flex-col items-center text-gray-700 hover:text-orange-500"
    >
      {icon}
      <span className="text-xs mt-1">{label}</span>
    </button>
  );
}
