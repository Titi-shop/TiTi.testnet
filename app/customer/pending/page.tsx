"use client";
import { useEffect, useState } from "react";
import { useLanguage } from "../../context/LanguageContext";

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
}
interface Order {
  id: number | string;
  buyer: string;
  total: number;
  status: string;
  note?: string;
  createdAt: string;
  items?: OrderItem[];
}

export default function PendingOrdersPage() {
  const { translate } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<string>("");

  useEffect(() => {
    const info = localStorage.getItem("pi_user");
    if (info) {
      const parsed = JSON.parse(info);
      const username = parsed?.user?.username || parsed?.username || "";
      setCurrentUser(username);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/orders", { cache: "no-store" });
        const data = (await res.json()) || [];
        const safe = Array.isArray(data)
          ? data.map((o: any) => ({ ...o, items: o.items || [] }))
          : [];
        const filtered = safe.filter(
          (o) =>
            o.buyer?.toLowerCase() === currentUser.toLowerCase() &&
            ["Chờ xác nhận", "pending", "Chờ xác minh"].includes(o.status)
        );
        setOrders(filtered);
      } catch (err) {
        console.error("❌ Lỗi tải đơn hàng:", err);
      } finally {
        setLoading(false);
      }
    };
    if (currentUser) load();
  }, [currentUser]);

  if (loading)
    return <p className="text-center text-gray-500 mt-10">⏳ Đang tải đơn hàng...</p>;

  return (
    <main className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-yellow-600 mb-4 text-center">
        ⏳ Đơn hàng đang chờ xác nhận
      </h1>

      {orders.length === 0 ? (
        <p className="text-center text-gray-500">Chưa có đơn hàng nào.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="border rounded p-4 bg-white shadow">
              <p>🧾 Mã đơn: #{order.id}</p>
              <p>💰 Tổng tiền: {order.total} Pi</p>
              <p>📅 Tạo lúc: {new Date(order.createdAt).toLocaleString()}</p>
              <ul className="ml-5 list-disc mt-2">
                {order.items?.length ? (
                  order.items.map((it, i) => (
                    <li key={i}>
                      {it.name} — {it.price} Pi × {it.quantity}
                    </li>
                  ))
                ) : (
                  <li className="text-gray-400 italic">Không có chi tiết sản phẩm</li>
                )}
              </ul>
              <p className="mt-2 text-yellow-700 font-medium">{order.status}</p>
              {order.note && <p className="text-sm text-gray-500 mt-1">📝 {order.note}</p>}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
