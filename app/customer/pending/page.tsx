"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/app/lib/i18n";
import { useAuth } from "@/context/AuthContext";

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  id: number;
  buyer: string;
  total: number;
  status: string;
  note?: string;
  createdAt: string;
  items: OrderItem[];
}

export default function PendingOrdersPage() {
  const router = useRouter();
  const { user, piReady } = useAuth(); // 👈 Lấy thông tin đăng nhập
  const { t, lang } = useTranslation(); // 👈 Ngôn ngữ & key dịch

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState<number | null>(null);

  // ✅ Kiểm tra đăng nhập — nếu chưa, chuyển sang PiLogin
  useEffect(() => {
    if (piReady && !user) router.replace("/pilogin");
  }, [piReady, user, router]);

  // 🔹 Lấy username từ AuthContext
  const currentUser = user?.username || "guest_user";

  // 🔹 Tự động dịch theo status từng ngôn ngữ
  const statusMap = {
    vi: ["Chờ xác nhận", "Đã thanh toán", "Chờ xác minh"],
    en: ["Pending", "Paid", "Waiting for verification"],
    zh: ["待确认", "已付款", "待核实"],
  };

  // 🔹 Load đơn hàng của người dùng
  useEffect(() => {
    if (!currentUser) return;

    const fetchOrders = async () => {
      try {
        const res = await fetch("/api/orders", { cache: "no-store" });
        const data: Order[] = await res.json();

        const filtered = data.filter(
          (o: Order) =>
            o.buyer?.toLowerCase() === currentUser.toLowerCase() &&
            statusMap[lang]?.includes(o.status)
        );

        setOrders(filtered);
      } catch (err: any) {
        setError(err.message || t.error_load_orders);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [currentUser, lang, t.error_load_orders]);

  // 🔹 Hủy đơn hàng
  const handleCancel = async (orderId: number) => {
    if (!confirm(t.confirm_cancel || "Bạn có chắc muốn hủy đơn?")) return;
    try {
      setProcessing(orderId);
      const res = await fetch(`/api/orders/cancel?id=${orderId}`, { method: "POST" });
      const data = await res.json();

      if (!data.ok) throw new Error(data.error || t.cancel_failed);

      alert(t.cancel_success || "Hủy thành công!");
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    } catch (err: any) {
      alert("❌ " + err.message);
    } finally {
      setProcessing(null);
    }
  };

  // 🕓 Loading
  if (loading) return <p className="text-center mt-10">⏳ {t.loading || "Đang tải..."}</p>;
  if (error) return <p className="text-center text-red-500">❌ {error}</p>;

  const totalPi = orders.reduce((sum, o) => sum + (parseFloat(String(o.total)) || 0), 0);

  return (
    <main className="p-4 max-w-4xl mx-auto bg-gray-50 min-h-screen pb-24">
      {/* ===== Header ===== */}
      <div className="flex items-center mb-4">
        <button
          onClick={() => router.back()}
          className="text-orange-500 font-semibold text-lg mr-2"
        >
          ←
        </button>
        <h1 className="text-2xl font-bold text-yellow-600 flex items-center gap-2">
          ⏳ {t.pending_orders || "Đơn hàng chờ xác nhận"}
        </h1>
      </div>

      {/* ===== Stats ===== */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white border rounded-lg p-4 text-center shadow">
          <p className="text-gray-500 text-sm">{t.total_orders || "Tổng đơn"}</p>
          <p className="text-2xl font-bold text-gray-800">{orders.length}</p>
        </div>
        <div className="bg-white border rounded-lg p-4 text-center shadow">
          <p className="text-gray-500 text-sm">{t.total_pi || "Tổng Pi"}</p>
          <p className="text-2xl font-bold text-gray-800">
            {totalPi.toFixed(2)} Pi
          </p>
        </div>
      </div>

      {/* ===== Orders List ===== */}
      {!orders.length ? (
        <p className="text-center text-gray-500">
          {t.no_pending_orders || "Không có đơn hàng chờ xác nhận."}
        </p>
      ) : (
        <div className="space-y-5">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md"
            >
              <h2 className="font-semibold text-lg">🧾 #{order.id}</h2>
              <p>💰 {t.total || "Tổng"}: <b>{order.total} Pi</b></p>
              <p>📅 {new Date(order.createdAt).toLocaleString()}</p>

              {order.items?.length > 0 && (
                <ul className="list-disc ml-6 mt-2 text-gray-700">
                  {order.items.map((item, i) => (
                    <li key={i}>
                      {item.name} — {item.price} Pi × {item.quantity}
                    </li>
                  ))}
                </ul>
              )}

              <button
                onClick={() => handleCancel(order.id)}
                disabled={processing === order.id}
                className="bg-red-500 text-white px-3 py-1 rounded-md mt-4"
              >
                {processing === order.id
                  ? t.canceling || "Đang hủy..."
                  : t.cancel_order || "❌ Hủy đơn"}
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="h-20"></div>
    </main>
  );
}
