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

export default function CustomerPendingPage() {
  const router = useRouter();
  const { user, piReady } = useAuth();
  const { t, lang } = useTranslation();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const currentUser = user?.username || "guest_user";
  const isLoggedIn = !!user;

  // 🔐 Redirect nếu chưa đăng nhập
  useEffect(() => {
    if (piReady && !user) {
      router.replace("/pilogin");
    }
  }, [piReady, user, router]);

  // 📦 Load đơn hàng Pending
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

      // 🔹 Lọc trạng thái đơn hàng theo ngôn ngữ
      const filterByLang = {
        vi: ["Chờ xác nhận", "Đã thanh toán", "Chờ xác minh"],
        en: ["Pending", "Paid", "Waiting for verification"],
        zh: ["待确认", "已付款", "待核实"],
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

  // 🗑 Hủy đơn
  const handleCancel = async (id: number) => {
    if (!confirm(t("confirm_cancel_message"))) return;

    try {
      await fetch(`/api/orders/cancel?id=${id}`, { method: "POST" });
      alert(t("cancel_success"));
      setOrders((prev) => prev.filter((o) => o.id !== id));
    } catch {
      alert(t("cancel_failed"));
    }
  };

  // 🕓 Loading UI
  if (loading)
    return <p className="text-center mt-6 text-gray-500">{t("loading_orders")}</p>;

  // 🔒 Chưa đăng nhập
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

  // 📊 Tổng đơn & Pi
  const totalOrders = orders.length;
  const totalPi = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);

  return (
    <main className="p-4 max-w-4xl mx-auto bg-gray-50 min-h-screen pb-24">
      {/* Giữ nguyên UI */}
      <div className="flex items-center mb-4">
        <button
          onClick={() => router.back()}
          className="text-orange-500 font-semibold text-lg mr-2"
        >
          ←
        </button>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
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
            <div
              key={order.id}
              className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition"
            >
              <div className="flex justify-between items-center mb-2">
                <h2 className="font-semibold text-lg">🧾 #{order.id}</h2>
                <button
                  onClick={() => handleCancel(order.id)}
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                >
                  ❌ {t("cancel_order")}
                </button>
              </div>

              <p>👤 <b>{t("buyer")}:</b> {order.buyer}</p>
              <p>💰 <b>{t("total")}:</b> {order.total} Pi</p>
              <p>📅 <b>{t("created_at")}:</b> {new Date(order.createdAt).toLocaleString()}</p>

              {order.items?.length ? (
                <ul className="ml-6 list-disc text-gray-700 mt-2">
                  {order.items.map((item, idx) => (
                    <li key={idx}>
                      {item.name} — {item.price} Pi × {item.quantity}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </div>
      )}

      <div className="h-20"></div>
    </main>
  );
}
