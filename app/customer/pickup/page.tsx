"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/app/lib/i18n";
import { useAuth } from "@/context/AuthContext";

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
  items: OrderItem[];
}

export default function PickupOrdersPage() {
  const router = useRouter();
  const { t, lang } = useTranslation();
  const { user, piReady } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const currentUser = user?.username || "guest_user";

  // 🔹 Kiểm tra đăng nhập từ AuthContext
  useEffect(() => {
    if (piReady && !user) {
      router.replace("/pilogin");
    }
  }, [piReady, user, router]);

  // 🔹 Load đơn hàng
  useEffect(() => {
    if (!currentUser) return;
    fetchOrders();
  }, [currentUser, lang]);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders", { cache: "no-store" });
      if (!res.ok) throw new Error(t("error_load_orders"));

      const data: Order[] = await res.json();
      const statusFilter = {
        vi: ["Đang giao", "Chờ lấy hàng"],
        en: ["Delivering", "Waiting for pickup"],
        zh: ["配送中", "等待取货"],
      }[lang];

      const filtered = data.filter(
        (o: Order) =>
          statusFilter.includes(o.status) &&
          o.buyer?.toLowerCase() === currentUser.toLowerCase()
      );

      setOrders(filtered);
    } catch (error) {
      console.error("❌", error);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Loading
  if (loading)
    return <p className="text-center mt-6">⏳ {t("loading_orders")}</p>;

  // 🔹 Tính tổng
  const totalPi = orders.reduce(
    (sum, o) => sum + (parseFloat(String(o.total)) || 0),
    0
  );

  return (
    <main className="p-4 max-w-4xl mx-auto bg-gray-50 min-h-screen pb-24">
      {/* ===== Header ===== */}
      <div className="flex items-center mb-4">
        <button
          onClick={() => router.back()}
          className="text-orange-500 font-semibold text-lg mr-2"
        >
          ←
        </button>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          📦 {t("pickup_orders")}
        </h1>
      </div>

      {/* ===== Summary ===== */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white border rounded-lg p-4 text-center shadow">
          <p className="text-gray-500 text-sm">{t("total_orders")}</p>
          <p className="text-2xl font-bold text-gray-800">{orders.length}</p>
        </div>
        <div className="bg-white border rounded-lg p-4 text-center shadow">
          <p className="text-gray-500 text-sm">{t("total_pi")}</p>
          <p className="text-2xl font-bold text-gray-800">
            {totalPi.toFixed(2)} Pi
          </p>
        </div>
      </div>

      {/* ===== Orders List ===== */}
      {!orders.length ? (
        <p className="text-center text-gray-500">
          {t("no_pickup_orders")}
          <br />
          👤 {t("current_user")}: <b>{currentUser}</b>
        </p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition"
            >
              <p>🧾 <b>{t("order_code")}</b> #{order.id}</p>
              <p>👤 <b>{t("buyer")}</b> {order.buyer}</p>
              <p>💰 <b>{t("total")}</b> {order.total} Pi</p>
              <p>📅 <b>{t("created_at")}</b> {order.createdAt}</p>
              <p>📊 <b>{t("status")}</b> {order.status}</p>

              <ul className="mt-2 text-sm">
                {order.items?.map((item, i) => (
                  <li key={i}>
                    • {item.name} — {item.price} Pi × {item.quantity}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* ===== Spacer ===== */}
      <div className="h-20"></div>
    </main>
  );
}
