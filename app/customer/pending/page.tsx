"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/app/lib/i18n";

export default function CustomerShippingPage() {
  const router = useRouter();
  const { user, piReady } = useAuth();
  const { t, lang } = useTranslation();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const currentUser = user?.username || "guest_user";
  const isLoggedIn = !!user;

  useEffect(() => {
    if (piReady && !isLoggedIn) router.replace("/pilogin");
  }, [piReady, isLoggedIn, router]);

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
      const data = await res.json();

      const filtered = data.filter(
        (o) =>
          o.status === (lang === "vi" ? "Đang giao" : lang === "en" ? "Delivering" : "配送中") &&
          o.buyer?.toLowerCase() === currentUser.toLowerCase()
      );

      setOrders(filtered);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p>{t.loading_orders}</p>;

  return (
    <main>
      <h1>🚚 {t.shipping_orders}</h1>
      <p>{t.total_orders}: {orders.length}</p>
      <p>{t.total_pi}: {orders.reduce((sum, o) => sum + Number(o.total || 0), 0)} Pi</p>
    </main>
  );
}
