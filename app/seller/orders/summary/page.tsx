"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

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
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
      );

      setOrders(sorted);
    } catch (err) {
      console.error("Lỗi tải đơn hàng:", err);
      alert("❌ Không thể tải danh sách đơn hàng!");
    } finally {
      setLoading(false);
    }
  };

  const totalPi = orders.reduce(
    (sum, o) => sum + (parseFloat(o.total) || 0),
    0
  );

  if (loading)
    return (
      <p className="text-center mt-10 text-gray-500">
        ⏳ Đang tải dữ liệu...
      </p>
    );

  return (
    <main className="min-h-screen max-w-4xl mx-auto p-4 pb-24 bg-gray-50">
      <div className="flex items-center mb-4">
        <button
          onClick={() => router.back()}
          className="text-orange-500 font-semibold text-lg mr-2"
        >
          ←
        </button>
        <h1 className="text-xl font-semibold text-gray-800">
          📦 Tổng đơn hàng
        </h1>
      </div>

      {/* Thống kê */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="card text-center">
          <p className="text-gray-500 text-sm">Tổng đơn</p>
          <p className="text-xl font-bold">{orders.length}</p>
        </div>
        <div className="card text-center">
          <p className="text-gray-500 text-sm">Tổng Pi</p>
          <p className="text-xl font-bold">{totalPi.toFixed(2)} Pi</p>
        </div>
      </div>

      {/* Danh sách đơn */}
      <div className="space-y-4">
        {orders.map((order) => (
          <div
            key={order.id}
            onClick={() => router.push(`/seller/orders/${order.id}`)}
            className="card cursor-pointer bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition"
          >
            <p>🧾 <b>Mã đơn:</b> #{order.id}</p>
            <p>👤 <b>Người mua:</b> {order.buyer || "guest_user"}</p>
            <p>💰 <b>Tổng:</b> {parseFloat(order.total).toFixed(2)} Pi</p>
            <p>📅 <b>Ngày tạo:</b> {order.createdAt || "—"}</p>
            <p>
              📊 <b>Trạng thái:</b>{" "}
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
