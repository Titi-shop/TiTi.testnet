"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function PendingOrders() {
  const { user, piReady } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!piReady || !user) return;
    fetchOrders();
  }, [piReady, user]);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders", { cache: "no-store" });
      const data = await res.json();
      const filtered = (data || []).filter((o: any) => o.status === "Đã hủy");
      setOrders(filtered);
    } catch {
      alert("Lỗi tải đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p className="text-center mt-10 text-gray-500">⏳ Đang tải...</p>;

  return (
    <main className="max-w-4xl mx-auto p-4">
      <h1 className="text-xl font-semibold mb-4">⏳ Đơn hàng chờ xác nhận</h1>
      {orders.length === 0 ? (
        <p className="text-center text-gray-500">Không có đơn chờ xác nhận.</p>
      ) : (
        orders.map((o) => (
          <div key={o.id} className="bg-white border p-3 rounded mb-3 shadow">
            <p>🧾 Mã đơn: #{o.id}</p>
            <p>👤 Người mua: {o.buyer}</p>
            <p>💰 Tổng: {o.total} Pi</p>
          </div>
        ))
      )}
    </main>
  );
}
