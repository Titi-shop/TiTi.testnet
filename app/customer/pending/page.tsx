"use client";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

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

  if (loading) return <p className="text-center mt-10">{t("loading_orders")}</p>;
  if (error) return <p className="text-center text-red-500">❌ {error}</p>;

  const totalOrders = orders.length;
  const totalPi = orders.reduce((sum, o) => sum + (parseFloat(String(o.total)) || 0), 0);

  return (
    <main className="p-4 max-w-4xl mx-auto bg-gray-50 min-h-screen pb-24">
      <div className="flex items-center mb-4">
        <button onClick={() => router.back()} className="text-orange-500 font-semibold text-lg mr-2">
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
          <p className="text-2xl font-bold text-gray-800">{totalPi.toFixed(2)} Pi</p>
        </div>
      </div>

      {!orders.length ? (
        <p className="text-center text-gray-500">
          {t("no_pending_orders")}
          <br />👤 {t("current_user")}: <b>{currentUser}</b>
        </p>
      ) : (
        <div className="space-y-5">
          {orders.map((order) => (
            <div key={order.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <h2 className="font-semibold text-lg">🧾 #{order.id}</h2>
              <p>💰 {t("total")}: <b>{order.total}</b> Pi</p>
              <p>📅 {t("created_at")}: {new Date(order.createdAt).toLocaleString()}</p>
              <p className="mt-3 text-yellow-600 font-medium">{t("status")}: {order.status}</p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
