"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "../../context/LanguageContext";

export default function PendingOrdersPage() {
  const { translate } = useLanguage();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ✅ Lấy username hiện tại từ localStorage (chỉ chạy client)
  const getCurrentUser = (): string => {
    if (typeof window === "undefined") return "";
    try {
      const info = localStorage.getItem("user_info");
      if (!info) return "";
      const parsed = JSON.parse(info);
      return parsed.username || "";
    } catch (err) {
      console.error("❌ Lỗi parse user_info:", err);
      return "";
    }
  };

  // 🧩 Tải danh sách đơn hàng từ Blob API
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch("/api/orders", { cache: "no-store" });
        if (!res.ok) throw new Error("Không thể tải dữ liệu đơn hàng.");

        const data = await res.json();
        const currentUser = getCurrentUser();

        // ✅ Lọc đơn hàng của người dùng có trạng thái chờ xác nhận
        const filtered = data.filter((o: any) => {
          const buyerName = o.buyer || o["người mua"] || "";
          const status = (o.status || "").toLowerCase();
          return (
            buyerName === currentUser &&
            (status.includes("chờ") || status.includes("pending") || status.includes("wait"))
          );
        });

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

  // 🕓 Trạng thái đang tải
  if (loading)
    return (
      <p className="text-center mt-10 text-gray-500">
        ⏳ {translate("loading") || "Đang tải đơn hàng..."}
      </p>
    );

  // ⚠️ Khi xảy ra lỗi
  if (error)
    return (
      <p className="text-center mt-10 text-red-500">
        ❌ {error}
      </p>
    );

  // 🚫 Khi không có đơn hàng nào
  if (orders.length === 0)
    return (
      <p className="text-center mt-10 text-gray-500">
        {translate("no_orders") || "Chưa có đơn hàng chờ xác nhận."}
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
            <p>👤 {translate("buyer") || "Người mua"}: <b>{order.buyer || order["người mua"]}</b></p>
            <p>💰 {translate("total") || "Tổng tiền"}: <b>{order.total}</b> Pi</p>
            <p>📅 {translate("created_at") || "Ngày tạo"}: {new Date(order.createdAt).toLocaleString("vi-VN")}</p>

            {order.items?.length > 0 && (
              <ul className="list-disc ml-6 mt-2 text-gray-700">
                {order.items.map((item: any, i: number) => (
                  <li key={i}>
                    {item.name || item.tên} — {item.price || item.giá} Pi × {item.quantity || item["số lượng"]}
                  </li>
                ))}
              </ul>
            )}

            <p className="mt-3 text-yellow-600 font-medium">
              {translate("status") || "Trạng thái"}: {order.status}
            </p>

            {order.note && (
              <p className="mt-1 text-gray-500 italic text-sm">
                📝 {translate("note") || "Ghi chú"}: {order.note}
              </p>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
