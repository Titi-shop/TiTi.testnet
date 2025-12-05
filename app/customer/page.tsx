"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";
import { Clock, Package, Truck, Star, RotateCcw } from "lucide-react";

export default function CustomerPage({ embedded = false }) {
  const router = useRouter();
  const { user, piReady } = useAuth();
  const { t } = useTranslation();
  const [avatar, setAvatar] = useState<string | null>(null);

  // ❗ Chỉ redirect khi KHÔNG chạy trong /account
  useEffect(() => {
    if (!embedded && piReady && !user) {
      router.replace("/pilogin");
    }
  }, [piReady, user]);

  // Avatar
  useEffect(() => {
    if (!user?.username) return;

    fetch(`/api/getAvatar?username=${user.username}`)
      .then((res) => res.json())
      .then((data) => data?.avatar && setAvatar(data.avatar))
      .catch(() => {});
  }, [user]);

  if (!user)
    return <div className="text-center py-10">Loading...</div>;

  return (
    <div className="pb-6 bg-gray-100">

      {/* 🔶 HEADER giống ảnh */}
      <div className="bg-orange-500 text-white p-6 text-center shadow">
        <div className="w-24 h-24 bg-white rounded-full mx-auto text-orange-600 text-4xl overflow-hidden shadow">
          {avatar ? (
            <img src={avatar} className="w-full h-full object-cover" />
          ) : (
            user.username.charAt(0).toUpperCase()
          )}
        </div>

        <p className="mt-3 text-lg font-semibold">@{user.username} ✔</p>
      </div>

      {/* MY ORDERS */}
      <section className="bg-white mx-4 mt-4 rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">My Orders</h2>
        </div>

        <div className="grid grid-cols-5 text-center py-4">
          <OrderItem icon={<Clock size={26} />} label="Pending Orders" path="/customer/pending" />
          <OrderItem icon={<Package size={26} />} label="Pickup Orders" path="/customer/pickup" />
          <OrderItem icon={<Truck size={26} />} label="Shipping Orders" path="/customer/shipping" />
          <OrderItem icon={<Star size={26} />} label="Reviews" path="/customer/review" />
          <OrderItem icon={<RotateCcw size={26} />} label="Return Orders" path="/customer/returns" />
        </div>
      </section>

      {/* Pi Wallet */}
      <section className="mx-4 mt-4 p-4 rounded-lg bg-orange-100 border border-orange-300 text-center">
        <p className="text-orange-700 font-medium">
          Pi Wallet: <span className="font-bold">{user.wallet_address || "Link Wallet"}</span>
        </p>
      </section>

    </div>
  );
}

function OrderItem({ icon, label, path }) {
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
