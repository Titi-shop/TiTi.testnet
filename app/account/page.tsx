"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

// 🔼 PHẦN TRÊN
import CustomerPage from "../customer/page";

// 🔶 PHẦN GIỮA (SELLER)
import SellerPage from "../seller/page";
import { isSellerByEnv } from "@/utils/roles";

// 🔽 PHẦN DƯỚI
import CustomerMenu from "@/components/customerMenu";

export default function AccountPage() {
  const router = useRouter();
  const { user, piReady } = useAuth();

  // 🚫 Chưa login → chuyển sang pilogin
  useEffect(() => {
    if (piReady && !user) {
      router.replace("/pilogin");
    }
  }, [piReady, user, router]);

  // ⏳ Loading
  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center text-gray-500">
        Loading...
      </main>
    );
  }

  const isSeller = isSellerByEnv(user);

  return (
    <main className="bg-gray-100 pb-20 space-y-6">

      {/* 🔼 PHẦN TRÊN: CUSTOMER */}
      <CustomerPage embedded />

      {/* 🔶 PHẦN GIỮA: SELLER (chỉ hiện nếu là seller) */}
      {isSeller && (
        <section className="bg-white rounded-xl shadow mx-4 p-4">
          <SellerPage embedded />
        </section>
      )}

      {/* 🔽 PHẦN DƯỚI: MENU */}
      <CustomerMenu />

    </main>
  );
}
