"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";

// Import customer components
import CustomerPage from "../customer/page"; 
import CustomerMenu from "@/components/customerMenu";

export default function AccountPage() {
  const router = useRouter();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const piUser = localStorage.getItem("pi_user");
    const isLoggedIn = localStorage.getItem("titi_is_logged_in");

    if (!piUser || isLoggedIn !== "true") {
      router.replace("/pilogin"); // chỉ redirect nếu chưa login
      return;
    }

    setUser(JSON.parse(piUser));
    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-600">
        <p>⏳ {t.checking_account}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hiển thị luôn UI customer và customerMenu */}
      <CustomerPage user={user} />
      <CustomerMenu />
    </main>
  );
}
