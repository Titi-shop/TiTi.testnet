"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from 'next-intl';
import { useAuth } from "@/context/AuthContext"; // 👉 Thêm dòng này

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
  const { translate, language } = useLanguage();
  
  // 👉 Dùng AuthContext
  const { user, pilogin, loading: authLoading } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState<number | null>(null);

  // ❗ Không dùng localStorage nữa
  const currentUser = user?.username || "";

  // 🟢 Lấy danh sách đơn hàng chờ xác nhận
  useEffect(() => {
    const fetchOrders = async () => {
      if (authLoading) return; // ⏳ Chờ auth load
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/orders", {
          method: "GET",
          cache: "no-store",
          headers: {
            Authorization: `Bearer ${user.accessToken}`, // 👉 gửi đúng token
          },
        });
        const data: Order[] = await res.json();

        const filterByLang = {
          vi: ["Chờ xác nhận", "Đã thanh toán", "Chờ xác minh"],
          en: ["Pending", "Paid", "Waiting for verification"],
          zh: ["待确认", "已付款", "待核实"],
        }[language];

        const filtered = data.filter(
          (o) =>
            o.buyer?.toLowerCase() === user.username.toLowerCase() &&
            filterByLang.includes(o.status)
        );

        setOrders(filtered);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [user, authLoading, language]);

  // 🛑 Nếu chưa đăng nhập 👉 Hiển thị nút đăng nhập Pi (không đổi UI khác)
  if (!authLoading && !user) {
    return (
      <main className="p-4 max-w-4xl mx-auto text-center min-h-screen bg-gray-50">
        <p className="text-gray-600 mb-4">
          ⚠️ Vui lòng đăng nhập để xem đơn hàng chờ xác nhận.
        </p>
        <button
          onClick={pilogin}
          className="bg-orange-500 text-white px-4 py-2 rounded-lg shadow"
        >
          🔑 Đăng nhập với Pi Network
        </button>
      </main>
    );
  }

  // 🔄 Giao diện loading
  if (loading) return <p className="text-center mt-10">⏳ Đang tải đơn hàng...</p>;
  if (error) return <p className="text-center text-red-500">❌ {error}</p>;

  // 📊 Tính tổng dữ liệu
  const totalOrders = orders.length;
  const totalPi = orders.reduce((sum, o) => sum + (parseFloat(String(o.total)) || 0), 0);

  // 💎 GIỮ NGUYÊN TOÀN BỘ GIAO DIỆN BÊN DƯỚI
  return (
    <main className="p-4 max-w-4xl mx-auto bg-gray-50 min-h-screen pb-24">
      {/* ===== Nút quay lại + Tiêu đề ===== */}
      <div className="flex items-center mb-4">
        <button
          onClick={() => router.back()}
          className="text-orange-500 font-semibold text-lg mr-2"
        >
          ←
        </button>
        <h1 className="text-2xl font-bold text-yellow-600 flex items-center gap-2">
          ⏳ Đơn hàng chờ xác nhận
        </h1>
      </div>

      {/* ===== Tổng đơn & Tổng Pi ===== */}
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
      {/* 👉 Giữ nguyên 100% UI */}
      {!orders.length ? (
        <p className="text-center text-gray-500">
          Không có đơn hàng chờ xác nhận.
          <br />
          👤 Người dùng: <b>{currentUser}</b>
        </p>
      ) : (
        <div className="space-y-5">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition"
            >
              <div className="flex justify-between items-center mb-2">
                <h2 className="font-semibold text-lg">🧾 Mã đơn: #{order.id}</h2>
              </div>

              <p>💰 Tổng tiền: <b>{order.total}</b> Pi</p>
              <p>📅 Ngày tạo: {new Date(order.createdAt).toLocaleString()}</p>

              {order.items?.length > 0 && (
                <ul className="list-disc ml-6 mt-2 text-gray-700">
                  {order.items.map((item, i) => (
                    <li key={i}>
                      {item.name} — {item.price} Pi × {item.quantity}
                    </li>
                  ))}
                </ul>
              )}

              <p className="mt-3 text-yellow-600 font-medium">
                Trạng thái: {order.status}
              </p>

              {order.note && (
                <p className="text-gray-500 italic text-sm mt-1">📝 {order.note}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="h-20"></div>
    </main>
  );
}
