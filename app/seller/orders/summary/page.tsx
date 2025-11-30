"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/app/lib/i18n";

interface Order {
  id: string;
  buyer: string;
  total: number;
  status: string;
  createdAt: string;
}

export default function OrdersSummaryPage() {
  const router = useRouter();
  const { user, piReady } = useAuth();
  const { t } = useTranslation(); // 🔹 Thêm i18n
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!piReady || !user) return;
    fetchOrders();
  }, [piReady, user]);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders", { cache: "no-store" });
      const data = await res.json();

      const sorted = (data || []).sort(
        (a: Order, b: Order) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
      );

      setOrders(sorted);
    } catch (err) {
      alert(t.error_load_orders || "❌ Không thể tải danh sách đơn hàng!");
    } finally {
      setLoading(false);
    }
  };

  const totalPi = orders.reduce(
    (sum, o) => sum + (parseFloat(String(o.total)) || 0),
    0
  );

  if (loading)
    return (
      <p className="text-center mt-10 text-gray-500">
        ⏳ {t.loading_data || "Đang tải dữ liệu..."}
      </p>
    );

  return (
    <main className="min-h-screen max-w-4xl mx-auto p-4 pb-24 bg-gray-50">
      {/* 🔙 Nút quay lại */}
      <div className="flex items-center mb-4">
        <button
          onClick={() => router.back()}
          className="text-orange-500 font-semibold text-lg mr-2"
        >
          ←
        </button>
        <h1 className="text-xl font-semibold text-gray-800">
          {t.orders_summary || "📦 Tổng đơn hàng"}
        </h1>
      </div>

      {/* 📊 Thống kê */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="card text-center">
          <p className="text-gray-500 text-sm">
            {t.total_orders || "Tổng đơn"}
          </p>
          <p className="text-xl font-bold">{orders.length}</p>
        </div>
        <div className="card text-center">
          <p className="text-gray-500 text-sm">{t.total_pi || "Tổng Pi"}</p>
          <p className="text-xl font-bold">{totalPi.toFixed(2)} Pi</p>
        </div>
      </div>

      {/* 🧾 Danh sách đơn */}
      <div className="space-y-4">
        {orders.map((order) => (
          <div
            key={order.id}
            onClick={() => router.push(`/seller/orders/${order.id}`)}
            className="card cursor-pointer bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition"
          >
            <p>🧾 <b>{t.order_id || "Mã đơn"}:</b> #{order.id}</p>
            <p>👤 <b>{t.buyer || "Người mua"}:</b> {order.buyer || "guest_user"}</p>
            <p>💰 <b>{t.total || "Tổng"}:</b> {parseFloat(order.total).toFixed(2)} Pi</p>
            <p>📅 <b>{t.created_at || "Ngày tạo"}:</b> {order.createdAt || "—"}</p>
            <p>
              📊 <b>{t.status || "Trạng thái"}:</b>{" "}
              <span className="font-semibold text-orange-500">
                {order.status}
              </span>
            </p>
          </div>
        ))}
      </div>

      <div className="h-20"></div>
    </main>
  );
}
