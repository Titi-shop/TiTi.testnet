"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Clock, Package, Truck, Star, RotateCcw } from "lucide-react";
import CustomerMenu from "@/components/customerMenu";
import "@/app/lib/i18n";

export default function CustomerDashboard() {
  const { user, piReady } = useAuth();
  const router = useRouter();

  // 🔹 Giữ nguyên logic translate nhưng không dùng context
  const translate = (key: string): string => key;

  const [avatar, setAvatar] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.username) return;

    fetch(`/api/getAvatar?username=${encodeURIComponent(user.username)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.avatar) setAvatar(data.avatar);
      })
      .catch(() => console.log("⚠️ Không thể tải avatar"));
  }, [user]);

  useEffect(() => {
    if (piReady && !user) {
      router.replace("/pilogin");
    }
  }, [piReady, user, router]);

  if (!piReady || !user)
    return (
      <main className="min-h-screen flex items-center justify-center text-gray-500">
        ⏳ Đang tải...
      </main>
    );

  return (
    <div className="min-h-screen bg-gray-100 pb-10">
      {/* ⭐ giữ nguyên UI */}
      {/* ... */}
    </div>
  );
}

/* Component MenuButton đã loại bỏ any */
function MenuButton({
  icon,
  label,
  path,
}: {
  icon: JSX.Element;
  label: string;
  path: string;
}) {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push(path)}
      className="flex flex-col items-center text-gray-700 hover:text-orange-500"
    >
      {icon}
      <span className="text-sm mt-1">{label}</span>
    </button>
  );
}
