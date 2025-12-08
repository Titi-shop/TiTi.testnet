"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

import CustomerPage from "../customer/page";
import CustomerMenu from "@/components/customerMenu";

export default function AccountPage() {
  const router = useRouter();
  const { user, piReady } = useAuth();

  // Nếu Pi SDK đã sẵn sàng và chưa login → chuyển qua /pilogin
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
    <main className="bg-gray-100 pb-20">
      <CustomerPage embedded />
      <CustomerMenu />
    </main>
  );
}
