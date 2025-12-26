"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

/* =====================
   TYPES
===================== */
interface OrderType {
  id: string | number;
  buyer?: string;
  total: number | string;
  status: string;
}

export default function CancelledOrders() {
  const router = useRouter();
  const { user, piReady } = useAuth();
  const [orders, setOrders] = useState<OrderType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!piReady || !user) return;
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [piReady, user]);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders", { cache: "no-store" });
      const data: OrderType[] = await res.json();

      const filtered = (data || []).filter(
        (o) => o.status === "Đã hủy"
      );

      setOrders(filtered);
    } catch (err: unknown) {
      console.error(err);
      alert("Lỗi tải đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  const totalPi = orders.reduce((sum, o) => {
    const value =
      typeof o.total === "number"
        ? o.total
        : parseFloat(o.total);
    return sum + (isNaN(value) ? 0 : value);
  }, 0);

  if (loading)
    return (
      <p className="text-center mt-10 text-gray-500">
        ⏳ Đang tải...
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
          ❌ Đơn hàng đã hủy
        </h1>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="card text-center">
          <p className="text-gray-500 text-sm">Tổng đơn</p>
          <p className="text-xl font-bold">{orders.length}</p>
        </div>
        <div className="card text-center">
          <p className="text-gray-500 text-sm">Tổng Pi</p>
          <p className="text-xl font-bold">
            {totalPi.toFixed(2)} Pi
          </p>
        </div>
      </div>

      {orders.length === 0 ? (
        <p className="text-center text-gray-500">
          Không có đơn đã hủy.
        </p>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <div
              key={o.id}
              className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition"
            >
              <p>🧾 <b>Mã đơn:</b> #{o.id}</p>
              <p>👤 <b>Người mua:</b> {o.buyer || "guest_user"}</p>
              <p>
                💰 <b>Tổng:</b>{" "}
                {(
                  typeof o.total === "number"
                    ? o.total
                    : parseFloat(o.total)
                ).toFixed(2)}{" "}
                Pi
              </p>
              <p>📅 <b>Trạng thái:</b> Đã hủy</p>
            </div>
          ))}
        </div>
      )}

      <div className="h-20" />
    </main>
  );
}
