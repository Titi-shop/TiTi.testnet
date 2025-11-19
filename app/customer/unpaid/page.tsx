"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext"; // 👉 dùng AuthContext

export default function UnpaidOrdersPage() {
  const { user, pilogin, loading: authLoading } = useAuth(); // 👉 lấy user & token trực tiếp
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const currentUser = user?.username || "";

  // 🚀 Tải đơn hàng khi có user (đã login)
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    fetchOrders();
  }, [user, authLoading]);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders", {
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${user?.accessToken}`, // 👉 gửi token nếu backend cần
        },
      });
      const all = await res.json();
      const filtered = all.filter(
        (o: any) =>
          o.buyer?.toLowerCase() === currentUser.toLowerCase() &&
          ["Chưa thanh toán", "pending"].includes(o.status)
      );
      setOrders(filtered);
    } catch (err) {
      console.error("❌ Lỗi tải đơn hàng:", err);
    } finally {
      setLoading(false);
    }
  };

  // 💳 Thanh toán lại bằng Pi SDK
  const repay = async (order: any) => {
    alert(`🔄 Thanh toán lại đơn ${order.id}`);
    const payment = {
      amount: order.total,
      memo: `Thanh toán lại đơn #${order.id}`,
      metadata: { orderId: order.id },
    };

    if (!window.Pi) {
      alert("⚠️ Vui lòng mở trong Pi Browser!");
      return;
    }

    window.Pi.createPayment(payment, {
      onReadyForServerApproval: async (pid: string) =>
        await fetch("/api/pi/approve", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            Authorization: `Bearer ${user?.accessToken}`,
          },
          body: JSON.stringify({ paymentId: pid }),
        }),
      onReadyForServerCompletion: async (pid: string, txid: string) =>
        await fetch("/api/pi/complete", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            Authorization: `Bearer ${user?.accessToken}`,
          },
          body: JSON.stringify({ paymentId: pid, txid }),
        }),
    });
  };

  // ❌ Hủy đơn
  const cancelOrder = async (id: number) => {
    if (!confirm(`Bạn có chắc muốn hủy đơn #${id}?`)) return;
    await fetch(`/api/orders/cancel`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user?.accessToken}`,
      },
      body: JSON.stringify({ id }),
    });
    alert("✅ Đã hủy đơn!");
    fetchOrders();
  };

  // ⏳ Loading
  if (authLoading || loading) return <p>Đang tải...</p>;

  // 🔐 Nếu chưa đăng nhập
  if (!user)
    return (
      <main className="p-6 text-center">
        <h2 className="text-xl text-red-600">🔐 Bạn chưa đăng nhập</h2>
        <button
          onClick={pilogin}
          className="mt-3 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded"
        >
          👉 Đăng nhập với Pi Network
        </button>
      </main>
    );

  // 🎨 GIỮ NGUYÊN GIAO DIỆN BÊN DƯỚI
  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold text-red-600 mb-4">
        🔴 Đơn chưa thanh toán
      </h1>
      {orders.length === 0 ? (
        <p>Không có đơn chưa thanh toán</p>
      ) : (
        orders.map((o) => (
          <div key={o.id} className="p-4 border rounded mb-3 bg-white shadow">
            <h2>🧾 Đơn #{o.id}</h2>
            <p>💰 Tổng: {o.total} Pi</p>
            <p>📅 Ngày tạo: {new Date(o.createdAt).toLocaleString()}</p>
            <div className="mt-3 space-x-2">
              <button
                onClick={() => repay(o)}
                className="bg-green-500 text-white px-3 py-1 rounded"
              >
                💳 Thanh toán lại
              </button>
              <button
                onClick={() => cancelOrder(o.id)}
                className="bg-gray-500 text-white px-3 py-1 rounded"
              >
                ❌ Hủy đơn
              </button>
            </div>
          </div>
        ))
      )}
    </main>
  );
}
