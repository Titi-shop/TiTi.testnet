"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";

export default function AccountRedirect() {
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    const piUser = localStorage.getItem("pi_user");
    const isLoggedIn = localStorage.getItem("titi_is_logged_in");

    if (piUser && isLoggedIn === "true") {
      router.replace("/customer");
    } else {
      router.replace("/pilogin");
    }
  }, [router]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-600">
      <p>⏳ {t.checking_account}</p>
    </main>
  );
}
