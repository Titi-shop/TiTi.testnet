"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/app/lib/i18n";

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  id: number;
  buyer: string;
  total: number;
  status: string;
  createdAt: string;
  items?: OrderItem[];
}

export default function CustomerShippingPage() {
  const router = useRouter();
  const { user, piReady } = useAuth();
  const { t, lang } = useTranslation();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const currentUser = user?.username || "guest_user";
  const isLoggedIn = !!user;

  useEffect(() => {
    if (piReady && !user) {
      router.replace("/pilogin");
    }
  }, [piReady, user, router]);

  useEffect(() => {
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }
    fetchOrders();
  }, [lang, isLoggedIn]);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders", { cache: "no-store" });
      if (!res.ok) throw new Error(t("error_loading_orders"));

      const data: Order[] = await res.json();
      const filterByLang = {
        vi: ["Đang giao"],
        en: ["Delivering"],
        zh: ["配送中"],
      }[lang];

      const filtered = data.filter(
        (o) =>
          filterByLang.includes(o.status) &&
          o.buyer?.toLowerCase() === currentUser.toLowerCase()
      );

      setOrders(filtered);
    } catch (err) {
      console.error("❌ Lỗi tải đơn hàng:", err);
    } finally {
      setLoading(false);
    }
  };

  const confirmReceived = async (id: number) => {
    if (!confirm(t("confirm_received_message"))) return;

    try {
      await fetch("/api/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          status: t("status_completed") || "Hoàn tất",
          buyer: currentUser,
        }),
      });

      alert(t("thanks_receive"));
      fetchOrders();
    } catch {
      alert(t("error_confirm"));
    }
  };

  if (loading)
    return <p className="text-center mt-6 text-gray-500">{t("loading_orders")}</p>;

  if (!isLoggedIn)
    return (
      <main className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-gray-50">
        <h2 className="text-xl text-red-600 mb-3">{t("login_required")}</h2>
        <button
          onClick={() => router.push("/pilogin")}
          className="mt-3 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded"
        >
          👉 {t("go_to_login")}
        </button>
      </main>
    );

  const totalOrders = orders.length;
  const totalPi = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);

  return (
    <main className="p-4 max-w-4xl mx-auto bg-gray-50 min-h-screen pb-24">
      {/* UI giữ nguyên */}
    </main>
  );
}
