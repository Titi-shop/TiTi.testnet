"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";

export default function AccountRedirect() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.replace("/customer");
      } else {
        router.replace("/pilogin");
      }
    }
  }, [user, loading, router]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-600">
      <p>⏳ {t.checking_account}</p>
    </main>
  );
}
