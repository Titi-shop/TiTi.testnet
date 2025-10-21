"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "../../context/LanguageContext";

export default function PendingOrdersPage() {
  const { translate } = useLanguage();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ✅ Lấy username hiện tại từ localStorage
  const getCurrentUser = (): string => {
    try {
      const info = localStorage.getItem("user_info");
      if (!info) return "";
      return JSON.parse(info).username || "";
    } catch {
      return "";
    }
  };

  // 🧩 Tải danh sách đơn hàng chờ xác nhận
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch("/api/orders", { cache: "no-store" });
        if (!res.ok) throw new Error("Không thể tải dữ liệu đơn hàng.");
        const data = await res.json();

        const currentUser = getCurrentUser();

        // ✅ Lọc đơn hàng của người dùng hiện tại có trạng thái "Chờ xác nhận"
        const filtered = data.filter(
          (o: any) =>
            ["Chờ xác nhận", "pending", "wait"].includes(o.status) &&
            o.buyer === currentUser
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
  }, []);

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
  if (orders.length === 0)
    return (
      <p className="text-center mt-10 text-gray-500">
        {translate("no_products") || "Chưa có đơn hàng chờ xác nhận."}
      </p>
    );

  // ✅ Hiển thị danh sách đơn hàng
  return (
    <main className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center text-yellow-600">
        ⏳ {translate("waiting_confirm") || "Đơn hàng đang chờ xác nhận"}
      </h1>

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
                {order.items.map((item: any, i: number) => (
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
