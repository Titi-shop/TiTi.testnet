"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext"; // 🔹 Thêm dòng này để lấy user từ AuthContext

interface Order {
  id: string;
  total: number;
  status: string;
}

export default function OrdersTabs() {
  const router = useRouter();
  const { user, loading, piReady } = useAuth(); // 🔹 Lấy từ AuthContext
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
      console.error("Lỗi tải đơn hàng:", err);
      alert("❌ Không thể tải dữ liệu đơn hàng!");
    } finally {
      setLoadingOrders(false);
    }
  };

  const calcStats = (status?: string) => {
    const filtered = status ? orders.filter((o) => o.status === status) : orders;
    const totalPi = filtered.reduce((sum, o) => sum + (parseFloat(String(o.total)) || 0), 0);
    return { count: filtered.length, totalPi: totalPi.toFixed(2) };
  };

  // ⏳ Loading
  if (!piReady || loading || loadingOrders || !user)
    return <p className="text-center mt-10 text-gray-500">⏳ Đang tải...</p>;

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
        <h1 className="text-xl font-semibold text-gray-800">📋 Danh mục đơn hàng</h1>
      </div>

      {/* ===== Nút danh mục ===== */}
      <div className="flex flex-col gap-3 mt-4">
        <button
          onClick={() => router.push("/seller/orders/summary")}
          className="btn-gray flex justify-between items-center"
        >
          <span>📦 Tất cả</span>
          <span className="text-sm text-gray-200">
            {calcStats().count} đơn · {calcStats().totalPi} Pi
          </span>
        </button>

        <button
          onClick={() => router.push("/seller/orders/pending")}
          className="btn-gray flex justify-between items-center"
        >
          <span>⏳ Chờ xác nhận</span>
          <span className="text-sm text-gray-200">
            {calcStats("Chờ xác nhận").count} đơn · {calcStats("Chờ xác nhận").totalPi} Pi
          </span>
        </button>

        <button
          onClick={() => router.push("/seller/orders/shipping")}
          className="btn-gray flex justify-between items-center"
        >
          <span>🚚 Đang giao</span>
          <span className="text-sm text-gray-200">
            {calcStats("Đang giao").count} đơn · {calcStats("Đang giao").totalPi} Pi
          </span>
        </button>

        <button
          onClick={() => router.push("/seller/orders/completed")}
          className="btn-gray flex justify-between items-center"
        >
          <span>✅ Hoàn tất</span>
          <span className="text-sm text-gray-200">
            {calcStats("Hoàn tất").count} đơn · {calcStats("Hoàn tất").totalPi} Pi
          </span>
        </button>

        <button
          onClick={() => router.push("/seller/orders/cancelled")}
          className="btn-gray flex justify-between items-center"
        >
          <span>❌ Đã hủy</span>
          <span className="text-sm text-gray-200">
            {calcStats("Đã hủy").count} đơn · {calcStats("Đã hủy").totalPi} Pi
          </span>
        </button>

        <button
          onClick={() => router.push("/seller/orders/returned")}
          className="btn-gray flex justify-between items-center"
        >
          <span>↩️ Hoàn lại</span>
          <span className="text-sm text-gray-200">
            {calcStats("Hoàn lại").count} đơn · {calcStats("Hoàn lại").totalPi} Pi
          </span>
        </button>
      </div>

      {/* ===== Đệm tránh che chân ===== */}
      <div className="h-20"></div>
    </main>
  );
}
