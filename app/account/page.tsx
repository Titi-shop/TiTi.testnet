"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CustomerPage from "../customer/page";
import CustomerMenu from "@/components/customerMenu";

export default function AccountPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const piUser = localStorage.getItem("pi_user");
    const isLoggedIn = localStorage.getItem("titi_is_logged_in");

    // ❌ Nếu chưa đăng nhập → chuyển sang pilogin
    if (!piUser || isLoggedIn !== "true") {
      router.replace("/pilogin");
      return;
    }

    // ✔ Đã đăng nhập → lấy user & hiển thị trang
    setUser(JSON.parse(piUser));
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p>Checking account...</p>
      </main>
    );
  }

  return (
    <main className="bg-gray-50 min-h-screen pb-20">
      {/* ⭐ PHẦN TRÊN = Customer UI (như hình bạn gửi) */}
      <CustomerPage user={user} />

      {/* ⭐ PHẦN DƯỚI = Customer Menu */}
      <CustomerMenu />
    </main>
  );
}
