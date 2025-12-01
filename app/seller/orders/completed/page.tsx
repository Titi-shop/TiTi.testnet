"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/app/lib/i18n";

interface Order {
  id: string;
  buyer: string;
  total: number;
  status: string;
}

export default function CompletedOrders() {
  const router = useRouter();
  const { user, piReady } = useAuth();
  const { t } = useTranslation(); // 🔹 i18n
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
      const filtered = (data || []).filter(
        (o: Order) => o.status === t.completed_orders || o.status === "Hoàn tất"
      );
      setOrders(filtered);
    } catch (err) {
      alert(t.error_load_orders || "❌ Lỗi tải đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  const totalPi = orders.reduce(
    (sum, o) => sum + (parseFloat(String(o.total)) || 0),
    0
  );

  if (loading)
    return <p className="text-center mt-10 text-gray-500">⏳ {t.loading || "Đang tải..."}</p>;

  return (
    <main className="min-h-screen max-w-4xl mx-auto p-4 pb-24 bg-gray-50">
      {/* ===== Thanh tiêu đề ===== */}
      <div className="flex items-center mb-4">
        <button
          onClick={() => router.back()}
          className="text-orange-500 font-semibold text-lg mr-2"
        >
          ←
        </button>
        <h1 className="text-xl font-semibold text-gray-800">
          ✅ {t.completed_orders || "Đơn hàng đã hoàn tất"}
        </h1>
      </div>

      {/* ===== Thống kê nhanh ===== */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="card text-center">
          <p className="text-gray-500 text-sm">{t.total_orders || "Tổng đơn"}</p>
          <p className="text-xl font-bold">{orders.length}</p>
        </div>
        <div className="card text-center">
          <p className="text-gray-500 text-sm">{t.total_pi || "Tổng Pi"}</p>
          <p className="text-xl font-bold">{totalPi.toFixed(2)} Pi</p>
        </div>
      </div>

      {/* ===== Danh sách đơn ===== */}
      {orders.length === 0 ? (
        <p className="text-center text-gray-500">
          {t.no_completed_orders || "Không có đơn đã hoàn tất."}
        </p>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <div
              key={o.id}
              className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition"
            >
              <p>🧾 <b>{t.order_id || "Mã đơn"}:</b> #{o.id}</p>
              <p>👤 <b>{t.buyer || "Người mua"}:</b> {o.buyer || "guest_user"}</p>
              <p>💰 <b>{t.total || "Tổng"}:</b> {parseFloat(String(o.total)).toFixed(2)} Pi</p>
              <p>📅 <b>{t.status || "Trạng thái"}:</b> {t.completed_orders || "Hoàn tất"}</p>
            </div>
          ))}
        </div>
      )}

      <div className="h-20"></div>
    </main>
  );
}
