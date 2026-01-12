"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

// 🔼 CUSTOMER
import CustomerPage from "../customer/page";

// 🔽 MENU
import CustomerMenu from "@/components/customerMenu";

// 🔻 SELLER (LUÔN HIỂN THỊ)
import SellerPage from "../seller/page";

export default function AccountPage() {
  const router = useRouter();
  const { user, piReady } = useAuth();

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

  return (
    <main className="bg-gray-100 pb-24 space-y-6">

      {/* CUSTOMER INFO */}
      <CustomerPage embedded />

      {/* CUSTOMER MENU */}
      <CustomerMenu />

      {/* SELLER PLATFORM – CUỐI TRANG */}
      <section className="bg-white rounded-2xl shadow mx-4 p-4">
        <SellerPage />
      </section>

    </main>
  );
}
