"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";
import { Clock, Package, Truck, Star, RotateCcw } from "lucide-react";

export default function CustomerPage() {
  const router = useRouter();
  const { user, piReady } = useAuth();
  const { t } = useTranslation();

  const [avatar, setAvatar] = useState<string | null>(null);

  // Nếu chưa đăng nhập thì đưa về pilogin
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
      .catch(() => {
        console.log("⚠️ Không thể tải avatar");
      });
  }, [user]);

  if (!piReady || !user) {
    return (
      <main className="min-h-screen flex items-center justify-center text-gray-500">
        Loading...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 pb-6">
      {/* 🔶 Header màu cam + username */}
      <div className="bg-orange-500 text-white p-6 text-center shadow">
        <div className="w-20 h-20 rounded-full bg-white mx-auto mb-3 overflow-hidden flex items-center justify-center text-orange-500 text-3xl font-bold shadow-lg">
          {avatar ? (
            <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            user.username.charAt(0).toUpperCase()
          )}
        </div>

        <h1 className="text-xl font-semibold flex items-center justify-center gap-1">
          @{user.username}
          <span className="text-blue-500 text-lg">✔</span>
        </h1>
      </div>

      {/* 🧾 My Orders */}
      <section className="bg-white mt-4 rounded-lg shadow mx-3">
        <div className="px-5 py-3 border-b">
          <h2 className="font-semibold text-gray-800 text-lg">
            {t.my_orders || "My Orders"}
          </h2>
        </div>

        <div className="grid grid-cols-5 text-center py-4">
          <OrderItem
            icon={<Clock size={26} />}
            label={t.pending_orders || "Pending Orders"}
            path="/customer/pending"
          />
          <OrderItem
            icon={<Package size={26} />}
            label={t.pickup_orders || "Pickup Orders"}
            path="/customer/pickup"
          />
          <OrderItem
            icon={<Truck size={26} />}
            label={t.shipping_orders || "Shipping Orders"}
            path="/customer/shipping"
          />
          <OrderItem
            icon={<Star size={26} />}
            label={t.review_orders || "Reviews"}
            path="/customer/review"
          />
          <OrderItem
            icon={<RotateCcw size={26} />}
            label={t.return_orders || "Return Orders"}
            path="/customer/returns"
          />
        </div>
      </section>

      {/* 💰 Pi Wallet: Link Wallet */}
      <section className="mx-3 mt-4 p-4 rounded-lg bg-orange-100 border border-orange-300 text-center">
        <p className="text-orange-700 font-medium">
          Pi Wallet:{" "}
          <span className="font-bold">
            {user.wallet_address || t.link_wallet || "Link Wallet"}
          </span>
        </p>
      </section>
    </main>
  );
}

function OrderItem({
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
