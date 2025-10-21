"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "../../context/LanguageContext";

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
  const { translate } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState<string>("");

  // ✅ Lấy username hiện tại từ localStorage
  useEffect(() => {
    try {
      const info = localStorage.getItem("user_info");
      if (!info) {
        console.warn("⚠️ Không tìm thấy user_info trong localStorage.");
        return;
      }
      const parsed = JSON.parse(info);
      setCurrentUser(parsed.username || "");
    } catch (err) {
      console.error("❌ Lỗi đọc user_info:", err);
    }
  }, []);

  // 🧩 Tải danh sách đơn hàng "Chờ xác nhận" của người dùng hiện tại
  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/orders", { cache: "no-store" });
        if (!res.ok) throw new Error("Không thể tải dữ liệu đơn hàng.");

        const data: Order[] = await res.json();
        if (!Array.isArray(data)) throw new Error("Dữ liệu đơn hàng không hợp lệ.");

        if (!currentUser) {
          console.warn("⚠️ Chưa đăng nhập — không thể lọc đơn hàng.");
          setOrders([]);
          return;
        }

        // ✅ Lọc đơn của người dùng hiện tại và đang chờ xác nhận
        const filtered = data.filter(
          (o) =>
            o.buyer?.toLowerCase() === currentUser.toLowerCase() &&
            ["Chờ xác nhận", "pending", "wait"].includes(o.status)
        );

        setOrders(filtered);
      } catch (err: any) {
        console.error("❌ Lỗi tải đơn hàng:", err);
        setError(err.message || "Không thể tải danh sách đơn hàng.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [currentUser]);

  // 🕓 Loading
  if (loading)
    return (
      <p className="text-center mt-10 text-gray-500">
        ⏳ {translate("loading") || "Đang tải đơn hàng..."}
      </p>
    );

  // ⚠️ Lỗi
  if (error)
    return (
      <p className="text-center mt-10 text-red-500">
        ❌ {error}
      </p>
    );

  // 🚫 Không có đơn nào
  if (!orders.length)
    return (
      <main className="p-6 max-w-4xl mx-auto text-center">
        <h1 className="text-2xl font-bold text-yellow-600 mb-2">
          ⏳ {translate("waiting_confirm") || "Đơn hàng đang chờ xác nhận"}
        </h1>
        <p className="text-gray-500 mb-4">
          {translate("no_products") || "Chưa có đơn hàng chờ xác nhận."}
        </p>
        <p className="text-gray-400 text-sm">
          👤 Người dùng hiện tại: {currentUser || "Chưa đăng nhập"}
        </p>
      </main>
    );

  // ✅ Hiển thị danh sách đơn hàng
  return (
    <main className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center text-yellow-600">
        ⏳ {translate("waiting_confirm") || "Đơn hàng đang chờ xác nhận"}
      </h1>

      <p className="text-center text-gray-500 mb-4">
        👤 Người dùng hiện tại: {currentUser || "Chưa đăng nhập"}
      </p>

      <div className="space-y-5">
        {orders.map((order) => (
          <div
            key={order.id}
            className="border border-gray-200 rounded-lg p-4 bg-white shadow hover:shadow-lg transition"
          >
            <h2 className="font-semibold text-lg mb-1">
              🧾 Mã đơn: #{order.id}
            </h2>
            <p>👤 Người mua: <b>{order.buyer}</b></p>
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
              <p className="mt-1 text-gray-500 italic text-sm">
                📝 {order.note}
              </p>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
