"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "../../context/LanguageContext";

export default function CustomerShippingPage() {
  const router = useRouter();
  const { translate, language } = useLanguage();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<string>("guest_user");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // ✅ Lấy thông tin từ localStorage của Pi login
  useEffect(() => {
    try {
      const stored = localStorage.getItem("pi_user");
      const logged = localStorage.getItem("titi_is_logged_in");

      if (stored && logged === "true") {
        const parsed = JSON.parse(stored);
        const username = parsed?.user?.username || parsed?.username || "guest_user";
        setCurrentUser(username);
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
      }
    } catch (err) {
      console.error("❌ Lỗi đọc dữ liệu đăng nhập:", err);
      setIsLoggedIn(false);
    }
  }, []);

  // 🧾 Lấy danh sách đơn hàng của người dùng
  useEffect(() => {
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }
    fetchOrders();
  }, [language, isLoggedIn]);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders");
      if (!res.ok) throw new Error("Không thể tải danh sách đơn hàng");

      const data = await res.json();

      // ✅ Lọc đơn "Đang giao" của người dùng hiện tại
      const filtered = data.filter(
        (o: any) =>
          (o.status === "Đang giao" || o.status === translate("delivering")) &&
          o.buyer?.toLowerCase() === currentUser.toLowerCase()
      );

      setOrders(filtered);
    } catch (err) {
      console.error("❌ Lỗi tải đơn hàng:", err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Người mua xác nhận "Đã nhận hàng"
  const confirmReceived = async (id: number) => {
    if (!confirm(translate("confirm_received") || "Xác nhận rằng bạn đã nhận được hàng?")) return;

    try {
      const res = await fetch("/api/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          status: translate("completed_status") || "Hoàn tất",
          buyer: currentUser,
        }),
      });

      if (!res.ok) throw new Error("Không thể cập nhật trạng thái.");

      alert(translate("thanks_confirm") || "✅ Cảm ơn bạn! Đơn hàng đã được xác nhận hoàn tất.");
      fetchOrders();
    } catch (error) {
      console.error("❌ Lỗi xác nhận:", error);
      alert(translate("error_confirm") || "Có lỗi xảy ra khi xác nhận đơn hàng.");
    }
  };

  // 🔄 Giao diện tải
  if (loading)
    return (
      <p className="text-center mt-6 text-gray-500">
        {translate("loading_orders") || "⏳ Đang tải danh sách đơn hàng..."}
      </p>
    );

  // 🔒 Nếu chưa đăng nhập
  if (!isLoggedIn)
    return (
      <main className="p-6 text-center">
        <h2 className="text-xl text-red-600 mb-3">
          🔐 {translate("login_required") || "Vui lòng đăng nhập bằng Pi Network"}
        </h2>
        <button
          onClick={() => router.push("/pilogin")}
          className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          👉 {translate("go_to_login") || "Đăng nhập ngay"}
        </button>
      </main>
    );

  // ✅ Hiển thị danh sách đơn hàng
  return (
    <main className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-5 text-center text-orange-600">
        🚚 {translate("shipping_orders_title") || "Đơn hàng đang giao"}
      </h1>

      {orders.length === 0 ? (
        <p className="text-center text-gray-500">
          {translate("no_shipping_orders") || "Bạn chưa có đơn hàng nào đang giao."}
          <br />
          👤 {translate("current_user") || "Tài khoản"}: <b>{currentUser}</b>
        </p>
      ) : (
        <div className="space-y-5">
          {orders.map((order) => (
            <div
              key={order.id}
              className="border rounded-lg p-5 shadow bg-white hover:shadow-md transition"
            >
              <div className="flex justify-between items-center mb-2">
                <h2 className="font-semibold text-lg">
                  🧾 {translate("order_code") || "Mã đơn"}: #{order.id}
                </h2>
                <span className="px-3 py-1 rounded text-sm font-medium bg-blue-100 text-blue-700">
                  {order.status}
                </span>
              </div>

              <p>
                <b>📦 {translate("seller_label") || "Người bán"}:</b> TiTi Shop
              </p>
              <p>
                <b>💰 {translate("total_amount") || "Tổng tiền"}:</b> {order.total} Pi
              </p>
              <p>
                <b>🕒 {translate("created_at") || "Ngày tạo"}:</b>{" "}
                {order.createdAt
                  ? new Date(order.createdAt).toLocaleString()
                  : translate("unknown") || "Không xác định"}
              </p>

              <div className="mt-2">
                <b>🧺 {translate("products_label") || "Sản phẩm"}:</b>
                <ul className="ml-6 list-disc text-gray-700">
                  {order.items?.map((item: any, idx: number) => (
                    <li key={idx}>
                      {item.name} — {item.price} Pi × {item.quantity || 1}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => confirmReceived(order.id)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded"
                >
                  ✅ {translate("confirm_received_button") || "Tôi đã nhận hàng"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
