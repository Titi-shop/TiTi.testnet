"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";

interface Order {
  id: string;
  total: number;
  status: string;
}

export default function OrdersTabs() {
  const router = useRouter();
  const { user, loading, piReady } = useAuth();
  const { t } = useTranslation(); // 👈 Dùng i18n
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // 🔹 Nếu chưa đăng nhập → chuyển về PiLogin
  useEffect(() => {
    if (piReady && !user) {
      router.replace("/pilogin");
    }
  }, [piReady, user, router]);

  useEffect(() => {
    if (user) fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders", { cache: "no-store" });
      const data = await res.json();
      setOrders(data || []);
    } catch (err) {
      alert(t.error_load_orders || "❌ Không thể tải dữ liệu đơn hàng!");
    } finally {
      setLoadingOrders(false);
    }
  };

  const calcStats = (status?: string) => {
    const filtered = status ? orders.filter((o) => o.status === status) : orders;
    const totalPi = filtered.reduce(
      (sum, o) => sum + (parseFloat(String(o.total)) || 0),
      0
    );
    return { count: filtered.length, totalPi: totalPi.toFixed(2) };
  };

  if (!piReady || loading || loadingOrders || !user)
    return <p className="text-center mt-10 text-gray-500">⏳ {t.loading}</p>;

  return (
    <main className="max-w-md mx-auto p-4 pb-24 bg-gray-50 min-h-screen">
      {/* ===== Nút quay lại ===== */}
      <div className="flex items-center mb-4">
        <button
          onClick={() => router.back()}
          className="text-orange-500 font-semibold text-lg mr-2"
        >
          ←
        </button>
        <h1 className="text-xl font-semibold text-gray-800">
          {t.orders_list || "📋 Danh mục đơn hàng"}
        </h1>
      </div>

      {/* ===== Buttons ===== */}
      <div className="flex flex-col gap-3 mt-4">
        {/* Tất cả */}
        <button
          onClick={() => router.push("/seller/orders/summary")}
          className="btn-gray flex justify-between items-center"
        >
          <span>{t.all_orders || "📦 Tất cả"}</span>
          <span className="text-sm text-gray-200">
            {calcStats().count} {t.orders} · {calcStats().totalPi} Pi
          </span>
        </button>

        {/* Chờ xác nhận */}
        <button
          onClick={() => router.push("/seller/orders/pending")}
          className="btn-gray flex justify-between items-center"
        >
          <span>{t.pending_orders || "⏳ Chờ xác nhận"}</span>
          <span className="text-sm text-gray-200">
            {calcStats("Chờ xác nhận").count} {t.orders} · {calcStats("Chờ xác nhận").totalPi} Pi
          </span>
        </button>

        {/* Đang giao */}
        <button
          onClick={() => router.push("/seller/orders/shipping")}
          className="btn-gray flex justify-between items-center"
        >
          <span>{t.shipping_orders || "🚚 Đang giao"}</span>
          <span className="text-sm text-gray-200">
            {calcStats("Đang giao").count} {t.orders} · {calcStats("Đang giao").totalPi} Pi
          </span>
        </button>

        {/* Hoàn tất */}
        <button
          onClick={() => router.push("/seller/orders/completed")}
          className="btn-gray flex justify-between items-center"
        >
          <span>{t.completed_orders || "✅ Hoàn tất"}</span>
          <span className="text-sm text-gray-200">
            {calcStats("Hoàn tất").count} {t.orders} · {calcStats("Hoàn tất").totalPi} Pi
          </span>
        </button>

        {/* Đã hủy */}
        <button
          onClick={() => router.push("/seller/orders/cancelled")}
          className="btn-gray flex justify-between items-center"
        >
          <span>{t.cancelled_orders || "❌ Đã hủy"}</span>
          <span className="text-sm text-gray-200">
            {calcStats("Đã hủy").count} {t.orders} · {calcStats("Đã hủy").totalPi} Pi
          </span>
        </button>

        {/* Hoàn lại */}
        <button
          onClick={() => router.push("/seller/orders/returned")}
          className="btn-gray flex justify-between items-center"
        >
          <span>{t.returned_orders || "↩️ Hoàn lại"}</span>
          <span className="text-sm text-gray-200">
            {calcStats("Hoàn lại").count} {t.orders} · {calcStats("Hoàn lại").totalPi} Pi
          </span>
        </button>
      </div>

      <div className="h-20"></div>
    </main>
  );
}
