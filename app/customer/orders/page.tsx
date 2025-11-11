"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function AllOrdersPage() {
  const { user, piReady } = useAuth();
  const router = useRouter();
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
      setOrders(Array.isArray(data) ? data : []);
    } catch {
      alert("❌ Lỗi tải đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return <p className="text-center text-gray-500 mt-10">⏳ Đang tải...</p>;

  return (
    <main className="max-w-4xl mx-auto p-4">
      {/* ===== Tiêu đề ===== */}
      <h1 className="text-2xl font-bold mb-4">📦 Tất cả đơn hàng</h1>

      {/* ===== Bộ lọc trạng thái ===== */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-6">
        <button
          onClick={() => router.push("/seller/orders/pending")}
          className="btn-orange"
        >
          Chờ xác nhận
        </button>
        <button
          onClick={() => router.push("/seller/orders/shipping")}
          className="btn-orange"
        >
          Đang giao
        </button>
        <button
          onClick={() => router.push("/seller/orders/completed")}
          className="btn-orange"
        >
          Hoàn tất
        </button>
        <button
          onClick={() => router.push("/seller/orders/canceled")}
          className="btn-orange"
        >
          Đã hủy
        </button>
        <button
          onClick={() => router.push("/seller/orders/returned")}
          className="btn-orange"
        >
          Hoàn lại
        </button>
      </div>

      {/* ===== Danh sách đơn hàng ===== */}
      {orders.length === 0 ? (
        <p className="text-center text-gray-500">
          Không có đơn hàng nào.
        </p>
      ) : (
        orders.map((o) => (
          <div
            key={o.id}
            className="bg-white border rounded-lg p-4 mb-3 shadow hover:shadow-md transition"
          >
            <div className="space-y-1">
              <p>🧾 <b>Mã đơn:</b> #{o.id}</p>
              <p>👤 <b>Người mua:</b> {o.buyer}</p>
              <p>💰 <b>Tổng:</b> {o.total} Pi</p>
              <p>
                📦 <b>Trạng thái:</b>{" "}
                <span className="text-orange-600 font-semibold">
                  {o.status}
                </span>
              </p>
            </div>

            {/* ❌ Không còn nút xác nhận ở đây */}
          </div>
        ))
      )}
    </main>
  );
}
