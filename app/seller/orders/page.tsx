"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "../../context/LanguageContext";

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  id: string;
  buyer: string;
  seller?: string;
  createdAt: string;
  total: number;
  status: string;
  items: OrderItem[];
}

export default function SellerOrdersPage() {
  const { translate } = useLanguage();
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [sellerUser, setSellerUser] = useState<string>("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // ✅ Lấy thông tin đăng nhập từ Pi login
  useEffect(() => {
    try {
      const stored = localStorage.getItem("pi_user");
      const logged = localStorage.getItem("titi_is_logged_in");

      if (stored && logged === "true") {
        const parsed = JSON.parse(stored);
        const username = parsed?.user?.username || parsed?.username || "guest_user";
        setSellerUser(username);
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
      }
    } catch (err) {
      console.error("❌ Lỗi khi đọc thông tin Pi login:", err);
      setIsLoggedIn(false);
    }
  }, []);

  // ✅ Nếu chưa đăng nhập thì dừng lại
  useEffect(() => {
    if (!isLoggedIn) {
      setLoading(false);
    } else {
      fetchOrders();
    }
  }, [isLoggedIn]);

  // ✅ Lấy danh sách đơn hàng
  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders", { cache: "no-store" });
      if (!res.ok) throw new Error("Không thể tải danh sách đơn hàng");

      const data = await res.json();

      // ✅ Lọc đơn theo seller hiện tại
      const filtered = data.filter(
        (o: any) =>
          !o.seller || o.seller?.toLowerCase() === sellerUser.toLowerCase()
      );

      setOrders(filtered);
    } catch (err) {
      console.error("❌ Lỗi tải đơn hàng:", err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Cập nhật trạng thái đơn hàng
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdating(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, seller: sellerUser }),
      });

      if (!res.ok) throw new Error("Cập nhật thất bại");

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      alert("✅ Đã cập nhật trạng thái đơn hàng!");
    } catch (err) {
      console.error("❌ Lỗi cập nhật:", err);
      alert("❌ Lỗi khi cập nhật đơn hàng!");
    } finally {
      setUpdating(null);
    }
  };

  // ✅ Lọc đơn theo trạng thái
  const filteredOrders =
    filter === "all" ? orders : orders.filter((o) => o.status === filter);

  const tabs = [
    { key: "all", label: translate("all") || "Tất cả" },
    { key: "Chờ xác nhận", label: translate("pending") || "Chờ xử lý" },
    { key: "Đang giao", label: translate("shipping") || "Đang giao" },
    { key: "Hoàn tất", label: translate("completed") || "Hoàn tất" },
    { key: "Đã hủy", label: translate("cancelled") || "Đã hủy" },
  ];

  // 🕓 Giao diện tải
  if (loading)
    return (
      <p className="text-center text-gray-500 mt-6">
        {translate("loading_orders") || "⏳ Đang tải đơn hàng..."}
      </p>
    );

  // 🔒 Nếu chưa đăng nhập
  if (!isLoggedIn)
    return (
      <main className="p-6 text-center">
        <h2 className="text-xl text-red-600 mb-3">
          🔐 {translate("login_required") || "Vui lòng đăng nhập bằng Pi Network để quản lý đơn hàng"}
        </h2>
        <button
          onClick={() => router.push("/pilogin")}
          className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          👉 {translate("go_to_login") || "Đăng nhập ngay"}
        </button>
      </main>
    );

  // ✅ Giao diện chính
  return (
    <main className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-center mb-4 text-blue-600">
        📦 {translate("order_manager_title") || "Quản lý đơn hàng"}
      </h1>

      <p className="text-center text-sm text-gray-500 mb-4">
        👤 {translate("seller_label") || "Người bán"}: <b>{sellerUser}</b>
      </p>

      {/* Tabs lọc trạng thái */}
      <div className="flex flex-wrap justify-center gap-2 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-3 py-1 rounded border ${
              filter === tab.key
                ? "bg-blue-600 text-white"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filteredOrders.length === 0 ? (
        <p className="text-center text-gray-500">
          {translate("no_orders") || "Không có đơn hàng nào."}
        </p>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div key={order.id} className="border rounded-lg bg-white shadow p-3">
              <p>🧾 <b>{translate("order_id") || "Mã đơn"}:</b> #{order.id}</p>
              <p>👤 {translate("buyer") || "Người mua"}: {order.buyer}</p>
              <p>🕒 {translate("created_at") || "Thời gian tạo"}: {new Date(order.createdAt).toLocaleString()}</p>
              <p>💰 {translate("total_amount") || "Tổng tiền"}: {order.total} Pi</p>
              <p>🧺 {translate("items") || "Sản phẩm"}:</p>
              <ul className="ml-6 list-disc">
                {order.items.map((it, i) => (
                  <li key={i}>
                    {it.name} — {it.price} Pi × {it.quantity}
                  </li>
                ))}
              </ul>

              <div className="flex justify-between items-center mt-3">
                <span
                  className={`inline-block px-3 py-1 rounded text-sm font-semibold ${
                    order.status === "Hoàn tất"
                      ? "bg-green-100 text-green-700"
                      : order.status === "Đang giao"
                      ? "bg-yellow-100 text-yellow-700"
                      : order.status === "Đã hủy"
                      ? "bg-red-100 text-red-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {order.status}
                </span>

                {order.status === "Chờ xác nhận" && (
                  <button
                    onClick={() => updateOrderStatus(order.id, "Đang giao")}
                    disabled={updating === order.id}
                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {updating === order.id ? "⏳ Đang xử lý..." : "✅ Xác nhận"}
                  </button>
                )}

                {order.status === "Đang giao" && (
                  <button
                    onClick={() => updateOrderStatus(order.id, "Hoàn tất")}
                    disabled={updating === order.id}
                    className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
                  >
                    {updating === order.id ? "⏳ ..." : "📦 Hoàn tất"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
