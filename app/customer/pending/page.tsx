"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";

interface Order {
  id: string;
  buyer: string;
  total: number;
  status: string;
  createdAt: string;
}

export default function PendingOrdersPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { t } = useTranslation();

  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState("");

  // Khi AuthContext loading xong → fetch orders
  useEffect(() => {
    if (loading) return;
    if (!user) return;

    const fetchOrders = async () => {
      try {
        const res = await fetch("/api/orders", {
          method: "GET",
          credentials: "include",
          cache: "no-store"
        });

        if (!res.ok) {
          throw new Error(t.error_load_orders_general);
        }

        const data: Order[] = await res.json();

        setOrders(
          data.filter(o =>
            o.buyer.toLowerCase() === user.username.toLowerCase()
          )
        );
      } catch (err) {
        if (err instanceof Error) setError(err.message);
      }
    };

    fetchOrders();
  }, [loading, user, t]);

  if (loading)
    return <p className="text-center mt-10">🔄 {t.loading}</p>;

  if (!user)
    return (
      <p className="text-center text-red-500 mt-10">
        ⚠️ {t.must_login_first}
      </p>
    );

  if (error)
    return <p className="text-center text-red-500 mt-10">❌ {error}</p>;

  const totalOrders = orders.length;
  const totalPi = orders.reduce((sum, o) => sum + o.total, 0);

  return (
    <main className="p-4 max-w-4xl mx-auto bg-gray-50 min-h-screen pb-24">
      <div className="flex items-center mb-4">
        <button className="text-orange-500 text-lg mr-2" onClick={() => router.back()}>
          ←
        </button>
        <h1 className="text-2xl font-bold text-yellow-600">
          ⏳ {t.pending_orders}
        </h1>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white border rounded-lg p-4 text-center shadow">
          <p className="text-gray-500 text-sm">{t.total_orders}</p>
          <p className="text-2xl font-bold">{totalOrders}</p>
        </div>
        <div className="bg-white border rounded-lg p-4 text-center shadow">
          <p className="text-gray-500 text-sm">{t.total_pi}</p>
          <p className="text-2xl font-bold">{totalPi.toFixed(2)} Pi</p>
        </div>
      </div>

      {/* List */}
      {!orders.length ? (
        <p className="text-center text-gray-500">
          {t.no_pending_orders}
          <br />👤 {t.buyer}: <b>{user.username}</b>
        </p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white p-4 rounded shadow border">
              <h2 className="font-semibold text-lg">🧾 {t.order_id}: #{order.id}</h2>
              <p>💰 {t.total}: <b>{order.total}</b> Pi</p>
              <p>📅 {t.created_at}: {new Date(order.createdAt).toLocaleString()}</p>
              <p className="mt-2 text-yellow-600">
                {t.status}: {t[`status_${order.status.toLowerCase()}`] || order.status}
              </p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
