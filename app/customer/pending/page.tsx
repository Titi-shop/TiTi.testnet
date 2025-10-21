"use client";

import { useEffect, useState } from "react";

export default function PendingOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState("guest");

  useEffect(() => {
    const info = localStorage.getItem("user_info");
    if (info) {
      const parsed = JSON.parse(info);
      setUser(parsed.username || "guest");
    }

    fetch("/api/orders")
      .then((res) => res.json())
      .then((data) => {
        const filtered = data.filter(
          (o: any) =>
            o["người mua"] === (parsed?.username || "guest") ||
            o.buyer === (parsed?.username || "guest")
        );
        setOrders(filtered);
      })
      .catch((err) => console.error("❌ Lỗi tải đơn:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <p className="text-center mt-10 text-gray-600">Đang tải đơn hàng...</p>
    );

  if (orders.length === 0)
    return (
      <p className="text-center mt-10 text-gray-500">
        Bạn chưa có đơn hàng nào đang chờ.
      </p>
    );

  return (
    <main className="max-w-3xl mx-auto p-4">
      <h1 className="text-xl font-bold text-center mb-6">🕓 Đơn hàng chờ xác nhận</h1>
      <div className="space-y-4">
        {orders.map((order, idx) => (
          <div
            key={idx}
            className="border rounded-lg p-4 shadow bg-white hover:shadow-lg transition"
          >
            <p>
              <b>Người mua:</b> {order["người mua"] || order.buyer}
            </p>
            <p>
              <b>Trạng thái:</b> {order.status}
            </p>
            <p>
              <b>Tổng cộng:</b> {order["tổng cộng"] || order.total} Pi
            </p>
            <p className="text-gray-500 text-sm">
              Ngày: {new Date(order.createdAt).toLocaleString()}
            </p>
            <hr className="my-2" />
            {order["mặt hàng"]?.map((item: any, i: number) => (
              <div key={i} className="flex items-center gap-3">
                <img
                  src={item["hình ảnh"]}
                  alt={item["tên"]}
                  className="w-16 h-16 rounded-md object-cover border"
                />
                <div>
                  <p className="font-semibold">{item["tên"]}</p>
                  <p className="text-sm text-gray-600">
                    Giá: {item["giá"]} Pi × SL: {item["số lượng"]}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </main>
  );
}
