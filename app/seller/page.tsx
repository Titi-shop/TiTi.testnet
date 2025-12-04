"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";
import { useAuth } from "@/context/AuthContext";

import { PackagePlus, Package, ClipboardList, Wallet } from "lucide-react";

export default function SellerDashboard() {
  const router = useRouter();
  const { user, loading, piReady } = useAuth();

  const { t } = useTranslation();
  const [role, setRole] = useState("");
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!loading && piReady && user) {
      fetch(`/api/users/role?username=${user.username}`)
        .then((r) => r.json())
        .then((d) => {
          setRole(d.role);
          if (d.role !== "seller") router.push("/no-access");
        })
        .finally(() => setChecking(false));
    }
  }, [loading, piReady, user]);

  if (checking || loading || !piReady)
    return <p className="text-center mt-10">⏳ Đang tải...</p>;

  if (!user || role !== "seller") return null;

  return (
    <main className="p-6 max-w-3xl mx-auto">
      {/* UI giữ nguyên */}
      {/* ... */}
    </main>
  );
}
