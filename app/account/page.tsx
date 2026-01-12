"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { LogOut } from "lucide-react";

// 🔼 CUSTOMER
import CustomerPage from "../customer/page";

// 🔽 MENU
import CustomerMenu from "@/components/customerMenu";

// 🔻 SELLER
import SellerPage from "../seller/page";

export default function AccountPage() {
  const router = useRouter();
  const { user, piReady, logout } = useAuth();

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
    <main className="bg-gray-100 pb-32 space-y-6">
      {/* CUSTOMER INFO */}
      <CustomerPage embedded />

      {/* CUSTOMER MENU */}
      <CustomerMenu />

      {/* SELLER PLATFORM */}
      <section className="bg-white rounded-2xl shadow mx-4 p-4">
        <SellerPage />
      </section>

      {/* ===== LOGOUT – CUỐI TRANG ===== */}
      <section className="mx-4">
        <button
          onClick={logout}
          className="w-full py-4 bg-red-500 hover:bg-red-600 
            text-white rounded-2xl flex items-center justify-center 
            gap-3 font-semibold text-lg shadow-lg"
        >
          <LogOut size={22} />
          Đăng xuất
        </button>
      </section>
    </main>
  );
}
