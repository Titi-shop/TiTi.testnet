"use client";

import { useEffect, useState } from "react";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";
import { useAuth } from "@/context/AuthContext";

/* ============================================================
   🟦 Type cho mỗi đơn hàng
   (KHÔNG dùng any, định nghĩa rõ ràng 100%)
============================================================ */
interface OrderItem {
  id: string;
  buyer: string;
  total: number;
  createdAt: string;
  status: string;
}

export default function OrdersSummaryPage() {
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();

  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  /* ============================================================
     🟩 Chỉ fetch đơn khi user sẵn sàng
  ============================================================ */
  useEffect(() => {
    if (!authLoading && user) {
      fetchOrders();
    }

    if (!authLoading && !user) {
      setLoading(false);
    }
  }, [authLoading, user]);

  /* ============================================================
     🟧 Hàm fetch đơn hàng — 100% Type-safe
  ============================================================ */
  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders", {
        method: "GET",
        credentials: "include", // 🔥 rất quan trọng → gửi cookie pi_user
        cache: "no-store",
      });

      if (!res.ok) {
        console.error("❌ Lỗi fetch orders, mã:", res.status);
        setOrders([]);
        return;
      }

      const data = (await res.json()) as unknown;

      if (Array.isArray(data)) {
        const parsed: OrderItem[] = data
          .map((o) => {
            if (
              typeof o === "object" &&
              o !== null &&
              "id" in o &&
              "buyer" in o &&
              "total" in o &&
              "createdAt" in o &&
              "status" in o
            ) {
              return {
                id: String(o.id),
                buyer: String(o.buyer),
                total: Number(o.total),
                createdAt: String(o.createdAt),
                status: String(o.status),
              };
            }

            return null;
          })
          .filter((x): x is OrderItem => x !== null);

        setOrders(parsed);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error("❌ Lỗi load orders:", err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  /* ============================================================
      ⏳ Loading Auth
  ============================================================ */
  if (authLoading) {
    return (
      <p className="text-center mt-10 text-gray-500">
        ⏳ {t.loading}...
      </p>
    );
  }

  /* ============================================================
      ⛔ Chưa đăng nhập
  ============================================================ */
  if (!user) {
    return (
      <main className="max-w-4xl mx-auto p-4">
        <p className="text-center text-gray-500 text-lg mt-10">
          ⚠️ {t.please_login_to_continue}
        </p>
      </main>
    );
  }

  /* ============================================================
      ⏳ Loading Orders
  ============================================================ */
  if (loading) {
    return (
      <p className="text-center mt-10 text-gray-500">
        ⏳ {t.loading_orders}...
      </p>
    );
  }

  /* ============================================================
      📦 Tính tổng
  ============================================================ */
  const totalOrders = orders.length;
  const totalPi = orders.reduce((sum, o) => sum + o.total, 0);

  return (
    <main className="max-w-4xl mx-auto p-4 pb-24 bg-gray-50 min-h-screen">
      {/* ===== Header ===== */}
      <div className="flex items-center mb-4">
        <button
          onClick={() => history.back()}
          className="text-orange-500 font-semibold text-lg mr-2"
        >
          ←
        </button>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          📦 {t.order_summary}
        </h1>
      </div>

      {/* ===== Summary ===== */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white border rounded-lg p-4 text-center shadow">
          <p className="text-gray-500 text-sm">{t.total_orders}</p>
          <p className="text-2xl font-bold text-gray-800">{totalOrders}</p>
        </div>
        <div className="bg-white border rounded-lg p-4 text-center shadow">
          <p className="text-gray-500 text-sm">{t.total_pi}</p>
          <p className="text-2xl font-bold text-gray-800">
            {totalPi.toFixed(2)} Pi
          </p>
        </div>
      </div>

      {/* ===== Danh sách đơn ===== */}
      {orders.length === 0 ? (
        <p className="text-center text-gray-500">{t.no_orders}</p>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <div
              key={o.id}
              className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition"
            >
              <p>🧾 <b>{t.order_code}:</b> #{o.id}</p>
              <p>👤 <b>{t.buyer}:</b> {o.buyer}</p>
              <p>💰 <b>{t.total}:</b> {o.total} Pi</p>
              <p>📅 <b>{t.created_at}:</b> {o.createdAt}</p>
              <p>📊 <b>{t.status}:</b> {o.status}</p>
            </div>
          ))}
        </div>
      )}

      <div className="h-20"></div>
    </main>
  );
}
