"use client";

import { useRouter } from "next/navigation";
import {
  User,
  Package,
  Wallet,
  HelpCircle,
  MessageCircle,
  Globe,
  MapPin,
  Store,
} from "lucide-react";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";
import { useAuth } from "@/context/AuthContext";

export default function CustomerMenu() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuth();

  const customerMenuItems = [
    { label: t.profile, icon: <User size={22} />, path: "/customer/profile" },
    { label: t.my_orders, icon: <Package size={22} />, path: "/customer/orders" },
    { label: t.pi_wallet, icon: <Wallet size={22} />, path: "/customer/wallet" },
    { label: t.messages, icon: <MessageCircle size={22} />, path: "/messages" },
    { label: t.language, icon: <Globe size={22} />, path: "/language" },
    { label: t.shipping_address, icon: <MapPin size={22} />, path: "/customer/address" },
    { label: t.support, icon: <HelpCircle size={22} />, path: "/support" },
  ];

  return (
    <div className="bg-white mx-3 mt-6 p-5 rounded-2xl shadow-lg border border-gray-100 mb-6">
      {/* ===== CUSTOMER MENU ===== */}
      <div className="grid grid-cols-4 gap-4 text-center">
        {customerMenuItems.map((item, i) => (
          <button
            key={i}
            onClick={() => router.push(item.path)}
            className="flex flex-col items-center text-gray-700 hover:text-orange-500"
          >
            <div className="p-3 bg-gray-100 rounded-full shadow-sm mb-1">
              {item.icon}
            </div>
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
      </div>

      {/* ===== REGISTER SELLER ===== */}
      {user?.role !== "seller" && (
        <div className="mt-6 border-t pt-4">
          <button
            onClick={async () => {
              const res = await fetch("/api/seller/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  shopName: user?.username || "",
                }),
              });

              const data = await res.json();

              if (res.ok) {
                alert(
                  t.register_seller_pending ||
                    "Đã gửi yêu cầu đăng ký bán hàng. Vui lòng chờ duyệt."
                );
              } else {
                alert(data.error || t.error);
              }
            }}
            className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl shadow"
          >
            <Store size={20} />
            {t.register_seller || "Đăng ký bán hàng"}
          </button>
        </div>
      )}
    </div>
  );
}
