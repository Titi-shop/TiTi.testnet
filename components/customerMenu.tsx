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
  LogOut,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";

export default function CustomerMenu() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { t } = useTranslation();

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

      {/* ===== LOGOUT ===== */}
      {user && <div className="border-t border-gray-200 my-4"></div>}

      {user && (
        <button
          onClick={logout}
          className="w-full py-2 bg-red-500 text-white rounded-lg flex items-center 
            justify-center gap-2 font-medium shadow-md hover:bg-red-600"
        >
          <LogOut size={18} /> {t.logout}
        </button>
      )}
    </div>
  );
}
