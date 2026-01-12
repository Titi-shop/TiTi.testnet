"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

// 🔼 PHẦN TRÊN
import CustomerPage from "../customer/page";

// 🔽 MENU
import CustomerMenu from "@/components/customerMenu";

// 🔻 SELLER (CUỐI TRANG)
import SellerPage from "../seller/page";
import { isSellerByEnv } from "@/utils/roles";

export default function AccountPage() {
  const router = useRouter();
  const { user, piReady } = useAuth();

  // 🚫 Chưa login → pilogin
  useEffect(() => {
    if (piReady && !user) {
      router.replace("/pilogin");
    }
  }, [piReady, user, router]);

  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center text-gray-500">
        Loading...
      </main>
    );
  }

  const isSeller = isSellerByEnv(user);

  return (
    <main className="bg-gray-100 pb-24 space-y-6">

      {/* 🔼 CUSTOMER INFO + ORDERS */}
      <CustomerPage embedded />

      {/* 🔽 CUSTOMER MENU + LOGOUT */}
      <CustomerMenu />

      {/* 🔻 SELLER PLATFORM (HIỂN THỊ CUỐI TRANG) */}
      {isSeller && (
        <section className="bg-white rounded-2xl shadow mx-4 p-4">
          <SellerPage />
        </section>
      )}
    </main>
  );
}
