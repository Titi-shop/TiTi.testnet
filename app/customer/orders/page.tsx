"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function OrdersSummaryPage() {
  const { user, pilogin, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 🚨 Chờ AuthContext load xong
  useEffect(() => {
    if (!authLoading && user?.accessToken) {
      fetchOrders();
    } else if (!authLoading && !user) {
      setLoading(false); // Không fetch nếu chưa login
    }
  }, [authLoading, user]);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders", {
        method: "GET",
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${user?.accessToken}`,
        },
      });
      const data = await res.json();
      setOrders(data || []);
    } catch (err) {
      console.error("❌ Lỗi tải đơn hàng:", err);
    } finally {
      setLoading(false);
    }
  };

  // 💡 Nếu vẫn đang tải AuthContext
  if (authLoading) {
    return <p className="text-center mt-10 text-gray-500">⏳ Đang kiểm tra đăng nhập...</p>;
  }

  // ❌ Nếu chưa đăng nhập → Hiển thị nút đăng nhập Pi
  if (!user) {
    return (
      <main className="max-w-4xl mx-auto p-4 text-center">
        <p className="text-gray-600 mb-4">⚠️ Vui lòng đăng nhập để xem đơn hàng.</p>
        <button
          onClick={pilogin}
          className="bg-orange-500 text-white px-4 py-2 rounded-lg shadow"
        >
          🔑 Đăng nhập với Pi Network
        </button>
      </main>
    );
  }

  // ⭐ Giữ NGUYÊN giao diện bạn đã viết
  if (loading)
    return <p className="text-center mt-10 text-gray-500">⏳ Đang tải...</p>;

  const totalOrders = orders.length;
  const totalPi = orders.reduce(
    (sum, o) => sum + (parseFloat(o.total) || 0),
    0
  );

  return (
    <main className="max-w-4xl mx-auto p-4 pb-24 bg-gray-50 min-h-screen">
      {/* ===== Tiêu đề ===== */}
      <div className="flex items-center mb-4">
        <button
          onClick={() => history.back()}
          className="text-orange-500 font-semibold text-lg mr-2"
        >
          ←
        </button>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          📦 Tổng đơn hàng
        </h1>
      </div>

      {/* ===== Khối tổng hợp ===== */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white border rounded-lg p-4 text-center shadow">
          <p className="text-gray-500 text-sm">Tổng đơn</p>
          <p className="text-2xl font-bold text-gray-800">{totalOrders}</p>
        </div>
        <div className="bg-white border rounded-lg p-4 text-center shadow">
          <p className="text-gray-500 text-sm">Tổng Pi</p>
          <p className="text-2xl font-bold text-gray-800">
            {totalPi.toFixed(2)} Pi
          </p>
        </div>
      </div>

      {/* ===== Danh sách đơn ===== */}
      {orders.length === 0 ? (
        <p className="text-center text-gray-500">Không có đơn hàng nào.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <div
              key={o.id}
              className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition"
            >
              <p>🧾 <b>Mã đơn:</b> #{o.id}</p>
              <p>👤 <b>Người mua:</b> {o.buyer}</p>
              <p>💰 <b>Tổng:</b> {o.total} Pi</p>
              <p>📅 <b>Ngày tạo:</b> {o.createdAt}</p>
              <p>📊 <b>Trạng thái:</b> {o.status}</p>
            </div>
          ))}
        </div>
      )}

      <div className="h-20"></div>
    </main>
  );
}
