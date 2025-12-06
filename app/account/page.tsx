"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

// 🔼 phần trên
import CustomerPage from "../customer/page";

// 🔽 phần dưới
import CustomerMenu from "@/components/customerMenu";

export default function AccountPage() {
  const router = useRouter();
  const { user, piReady } = useAuth();

  // Nếu chưa login → pilogin
  useEffect(() => {
    if (piReady && !user) {
      router.replace("/pilogin");
    }
  }, [piReady, user]);

  if (!user)
    return (
      <main className="min-h-screen flex items-center justify-center text-gray-500">
        Loading...
      </main>
    );

  return (
    <main className="bg-gray-100 pb-20">

      {/* 🔶 PHẦN TRÊN: Customer UI (từ customer/page.tsx) */}
      <CustomerPage embedded />

      {/* 🔽 PHẦN DƯỚI: Customer Menu */}
      <CustomerMenu />

    </main>
  );
}
