"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  note?: string;
  createdAt: string;
  items: OrderItem[];
}

export default function PendingOrdersPage() {
  const router = useRouter();
  const { t, lang } = useTranslation();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState<string>("");
  const [processing, setProcessing] = useState<number | null>(null);

  useEffect(() => {
    try {
      const info = localStorage.getItem("pi_user");
      const parsed = info ? JSON.parse(info) : null;
      const username = parsed?.user?.username || parsed?.username || "guest_user";
      setCurrentUser(username);
    } catch (err) {
      console.error("❌ Lỗi đọc pi_user:", err);
    }
  }, []);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch("/api/orders", { method: "GET", cache: "no-store" });
        const data: Order[] = await res.json();

        const filterByLang = {
          vi: ["Chờ xác nhận", "Đã thanh toán", "Chờ xác minh"],
          en: ["Pending", "Paid", "Waiting for verification"],
          zh: ["待确认", "已付款", "待核实"],
        }[lang];

        const filtered = data.filter(
          (o) =>
            o.buyer?.toLowerCase() === currentUser.toLowerCase() &&
            filterByLang.includes(o.status)
        );
        setOrders(filtered);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [currentUser, lang]);

  const handleCancel = async (orderId: number) => {
    if (!confirm(t("cancel_confirm"))) return;
    try {
      setProcessing(orderId);
      const res = await fetch(`/api/orders/cancel?id=${orderId}`, { method: "POST" });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || t("cancel_failed"));
      alert(t("cancel_success"));
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    } catch (err: any) {
      alert("❌ " + err.message);
    } finally {
      setProcessing(null);
    }
  };

  if (loading) return <p className="text-center mt-10">{t("loading_orders")}</p>;
  if (error) return <p className="text-center text-red-500">❌ {error}</p>;

  const totalOrders = orders.length;
  const totalPi = orders.reduce((sum, o) => sum + (parseFloat(String(o.total)) || 0), 0);

  return (
    <main className="p-4 max-w-4xl mx-auto bg-gray-50 min-h-screen pb-24">
      <div className="flex items-center mb-4">
        <button
          onClick={() => router.back()}
          className="text-orange-500 font-semibold text-lg mr-2"
        >
          ←
        </button>
        <h1 className="text-2xl font-bold text-yellow-600 flex items-center gap-2">
          ⏳ {t("pending_orders")}
        </h1>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white border rounded-lg p-4 text-center shadow">
          <p className="text-gray-500 text-sm">{t("total_orders")}</p>
          <p className="text-2xl font-bold text-gray-800">{totalOrders}</p>
        </div>
        <div className="bg-white border rounded-lg p-4 text-center shadow">
          <p className="text-gray-500 text-sm">{t("total_pi")}</p>
          <p className="text-2xl font-bold text-gray-800">
            {totalPi.toFixed(2)} Pi
          </p>
        </div>
      </div>

      {!orders.length ? (
        <p className="text-center text-gray-500">
          {t("no_pending_orders")}
          <br />
          👤 {t("current_user")}: <b>{currentUser}</b>
        </p>
      ) : (
        <div className="space-y-5">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition"
            >
              <div className="flex justify-between items-center mb-2">
                <h2 className="font-semibold text-lg">🧾 #{order.id}</h2>
                <button
                  onClick={() => handleCancel(order.id)}
                  disabled={processing === order.id}
                  className={`px-3 py-1 text-white rounded-md text-sm ${
                    processing === order.id
                      ? "bg-gray-400"
                      : "bg-red-500 hover:bg-red-600"
                  }`}
                >
                  {processing === order.id ? t("cancelling") : t("cancel_order")}
                </button>
              </div>

              <p>💰 {t("total")}: <b>{order.total}</b> Pi</p>
              <p>📅 {t("created_at")}: {new Date(order.createdAt).toLocaleString()}</p>

              {order.items?.length > 0 && (
                <ul className="list-disc ml-6 mt-2 text-gray-700">
                  {order.items.map((item, i) => (
                    <li key={i}>
                      {item.name} — {item.price} Pi × {item.quantity}
                    </li>
                  ))}
                </ul>
              )}

              <p className="mt-3 text-yellow-600 font-medium">
                {t("status")}: {order.status}
              </p>

              {order.note && (
                <p className="text-gray-500 italic text-sm mt-1">
                  📝 {order.note}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="h-20"></div>
    </main>
  );
}
