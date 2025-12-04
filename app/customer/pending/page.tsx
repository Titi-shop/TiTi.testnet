"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

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

  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState("");

  // Khi AuthContext loading xong → fetch orders
  useEffect(() => {
    if (loading) return;
    if (!user) return; // chưa login → không fetch

    const fetchOrders = async () => {
      try {
        const res = await fetch("/api/orders", {
          method: "GET",
          credentials: "include", // dùng session pi_session
          cache: "no-store"
        });

        if (!res.ok) {
          throw new Error("Không thể tải đơn hàng");
        }

        const data: Order[] = await res.json();

        // Lọc đơn thuộc người dùng
        setOrders(
          data.filter(o => o.buyer.toLowerCase() === user.username.toLowerCase())
        );
      } catch (err) {
        if (err instanceof Error) setError(err.message);
      }
    };

    fetchOrders();
  }, [loading, user]);

  if (loading) return <p className="text-center mt-10">🔄 Đang tải...</p>;

  if (!user)
    return (
      <p className="text-center text-red-500 mt-10">
        ⚠️ Bạn chưa đăng nhập Pi Network
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
          ⏳ Đơn hàng đang chờ
        </h1>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white border rounded-lg p-4 text-center shadow">
          <p className="text-gray-500 text-sm">Tổng đơn hàng</p>
          <p className="text-2xl font-bold">{totalOrders}</p>
        </div>
        <div className="bg-white border rounded-lg p-4 text-center shadow">
          <p className="text-gray-500 text-sm">Tổng Pi</p>
          <p className="text-2xl font-bold">{totalPi.toFixed(2)} Pi</p>
        </div>
      </div>

      {/* List */}
      {!orders.length ? (
        <p className="text-center text-gray-500">
          Không có đơn hàng nào
          <br />👤 Người dùng: <b>{user.username}</b>
        </p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white p-4 rounded shadow border">
              <h2 className="font-semibold text-lg">🧾 #{order.id}</h2>
              <p>💰 Tổng: <b>{order.total}</b> Pi</p>
              <p>📅 Ngày tạo: {new Date(order.createdAt).toLocaleString()}</p>
              <p className="mt-2 text-yellow-600">Trạng thái: {order.status}</p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
