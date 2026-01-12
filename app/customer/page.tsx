"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";
import { Clock, Package, Truck, Star, RotateCcw } from "lucide-react";

type PublicUser = {
  username?: string;
  wallet_address?: string;
};

export default function CustomerPage({ embedded = false }) {
  const router = useRouter();
  const { t } = useTranslation();

  // 🔓 USER GIẢ (PUBLIC)
  const [user, setUser] = useState<PublicUser>({
    username: "guest_user",
    wallet_address: "",
  });

  const [avatar, setAvatar] = useState<string | null>(null);

  /* ===============================
     LOAD AVATAR (NẾU CÓ)
  =============================== */
  useEffect(() => {
    if (!user?.username) return;

    fetch(`/api/getAvatar?username=${user.username}`)
      .then((res) => res.json())
      .then((data) => data?.avatar && setAvatar(data.avatar))
      .catch(() => {});
  }, [user]);

  return (
    <div className="pb-6 bg-gray-100">

      {/* HEADER */}
      <div className="bg-orange-500 text-white p-6 text-center shadow">
        <div className="w-24 h-24 bg-white rounded-full mx-auto text-orange-600 text-4xl overflow-hidden shadow">
          {avatar ? (
            <img src={avatar} className="w-full h-full object-cover" />
          ) : (
            user.username?.charAt(0)?.toUpperCase() || "G"
          )}
        </div>

        <p className="mt-3 text-lg font-semibold">
          @{user.username || "guest"} ✔
        </p>
      </div>

      {/* MY ORDERS */}
      <section className="bg-white mx-4 mt-4 rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">{t.my_orders}</h2>
        </div>

        <div className="grid grid-cols-5 text-center py-4">
          <OrderItem icon={<Clock size={26} />} label={t.pending_orders} path="/customer/pending" />
          <OrderItem icon={<Package size={26} />} label={t.pickup_orders} path="/customer/pickup" />
          <OrderItem icon={<Truck size={26} />} label={t.shipping_orders} path="/customer/shipping" />
          <OrderItem icon={<Star size={26} />} label={t.review_orders} path="/customer/review" />
          <OrderItem icon={<RotateCcw size={26} />} label={t.return_orders} path="/customer/returns" />
        </div>
      </section>

      {/* WALLET */}
      <section className="mx-4 mt-4 p-4 rounded-lg bg-orange-100 border border-orange-300 text-center">
        <p className="text-orange-700 font-medium">
          {t.wallet}:{" "}
          <span className="font-bold">
            {user.wallet_address || t.link_wallet}
          </span>
        </p>
      </section>

    </div>
  );
}

/* ===============================
   ORDER ITEM
=============================== */
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
