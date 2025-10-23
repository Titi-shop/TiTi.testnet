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
  id: string | number;
  buyer: string;
  seller?: string;
  createdAt: string;
  total: number;
  status: string;
  items?: OrderItem[]; // ✅ optional để không crash
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

  useEffect(() => {
    try {
      const stored = localStorage.getItem("pi_user");
      const logged = localStorage.getItem("titi_is_logged_in");

      if (stored && logged === "true") {
        const parsed = JSON.parse(stored);
        const username = parsed?.user?.username || parsed?.username || "guest_user";
        setSellerUser(username);
        setIsLoggedIn(true);
      }
    } catch {
      setIsLoggedIn(false);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) fetchOrders();
    else setLoading(false);
  }, [isLoggedIn]);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders", { cache: "no-store" });
      if (!res.ok) throw new Error("Không thể tải danh sách đơn hàng");
      const data = await res.json();

      // ✅ Đảm bảo luôn có items array để tránh crash
      const safeOrders = (Array.isArray(data) ? data : []).map((o: any) => ({
        ...o,
        items: o.items || [],
        status: o.status || "Chờ xác nhận",
      }));

      // ✅ Lọc đơn theo seller
      const filtered = safeOrders.filter(
        (o) =>
          !o.seller ||
          o.seller?.toLowerCase() === sellerUser.toLowerCase()
      );

      setOrders(filtered);
    } catch (err) {
      console.error("❌ Lỗi tải đơn hàng:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: any, newStatus: string) => {
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
    } catch (err) {
      alert("❌ Lỗi khi cập nhật đơn hàng!");
    } finally {
      setUpdating(null);
    }
  };

  const filteredOrders =
    filter === "all" ? orders : orders.filter((o) => o.status === filter);

  if (loading)
    return <p className="text-center text-gray-500 mt-6">⏳ Đang tải đơn hàng...</p>;

  if (!isLoggedIn)
    return (
      <main className="p-6 text-center">
        <h2 className="text-xl text-red-600 mb-3">
          🔐 Vui lòng đăng nhập bằng Pi Network để quản lý đơn hàng
        </h2>
        <button
          onClick={() => router.push("/pilogin")}
          className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          👉 Đăng nhập ngay
        </button>
      </main>
    );

  return (
    <main className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-center mb-4 text-blue-600">
        📦 Quản lý đơn hàng
      </h1>

      <div className="flex flex-wrap justify-center gap-2 mb-4">
        {["all", "Chờ xác nhận", "Đang giao", "Hoàn tất", "Đã hủy"].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3 py-1 rounded border ${
              filter === tab ? "bg-blue-600 text-white" : "bg-gray-100"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {filteredOrders.length === 0 ? (
        <p className="text-center text-gray-500">Không có đơn hàng nào.</p>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div key={order.id} className="border rounded-lg bg-white shadow p-3">
              <p>🧾 Mã đơn: #{order.id}</p>
              <p>👤 Người mua: {order.buyer}</p>
              <p>🕒 Tạo lúc: {new Date(order.createdAt).toLocaleString()}</p>
              <p>💰 Tổng: {order.total} Pi</p>
              <p>🧺 Sản phẩm:</p>
              <ul className="ml-6 list-disc">
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

              <div className="flex justify-between items-center mt-3">
                <span className="px-3 py-1 bg-gray-100 rounded text-sm">{order.status}</span>
                {["Chờ xác nhận", "Đã thanh toán", "Chờ xác minh"].includes(order.status) && (
  <button
    onClick={() => updateOrderStatus(order.id, "Đang giao")}
    disabled={updating === order.id}
    className="px-3 py-1 bg-blue-600 text-white rounded"
  >
    ✅ Xác nhận
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
