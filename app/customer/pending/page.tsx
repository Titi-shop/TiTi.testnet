"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "../../context/LanguageContext";

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  id: string;
  buyer: string;
  total: number;
  status: string;
  createdAt: string;
  items: OrderItem[];
}

export default function PendingOrdersPage() {
  const { translate } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState<string>("");

  // ✅ Lấy thông tin người dùng Pi
  useEffect(() => {
    try {
      const info = localStorage.getItem("user_info");
      if (info) {
        const parsed = JSON.parse(info);
        setUsername(parsed.username);
      }
    } catch {
      console.warn("⚠️ Không thể đọc user_info trong localStorage");
    }
  }, []);

  // ✅ Tải danh sách đơn hàng theo user
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch("/api/orders", { cache: "no-store" });
        const data = await res.json();

        const myOrders = data.filter(
          (o: Order) =>
            o.status === "Chờ xác nhận" &&
            o.buyer?.toLowerCase() === username?.toLowerCase()
        );

        setOrders(myOrders);
      } catch (err) {
        console.error("❌ Lỗi tải đơn hàng:", err);
      } finally {
        setLoading(false);
      }
    };

    if (username) fetchOrders();
  }, [username]);

  // ✅ Giao diện
  return (
    <main className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-center text-yellow-600 mb-4">
        ⏳ {translate("pending_orders_title") || "Đơn hàng chờ xác nhận"}
      </h1>

      <p className="text-center text-gray-600 mb-3">
        👤 {translate("current_user") || "Người dùng hiện tại"}:{" "}
        {username || translate("not_logged_in") || "Chưa đăng nhập"}
      </p>

      {loading ? (
        <p className="text-center text-gray-400">
          {translate("loading_orders") || "Đang tải đơn hàng..."}
        </p>
      ) : orders.length === 0 ? (
        <p className="text-center text-gray-500">
          {translate("no_pending_orders") ||
            "Hiện bạn chưa có đơn hàng nào đang chờ xác nhận."}
        </p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="border bg-white rounded-lg shadow p-4"
            >
              <h2 className="font-semibold text-lg">
                🧾 {translate("order_id") || "Mã đơn"}: #{order.id}
              </h2>
              <p>
                💰 {translate("total_amount") || "Tổng tiền"}: {order.total} Pi
              </p>
              <p>
                📅 {translate("created_at") || "Ngày tạo"}:{" "}
                {new Date(order.createdAt).toLocaleString()}
              </p>

              <ul className="list-disc ml-6 mt-2 text-sm text-gray-700">
                {order.items.map((item, i) => (
                  <li key={i}>
                    {item.name} — {item.price} Pi × {item.quantity}
                  </li>
                ))}
              </ul>

              <p className="mt-2 font-medium text-yellow-600">
                {translate("status") || "Trạng thái"}:{" "}
                {translate("pending") || order.status}
              </p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
