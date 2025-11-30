"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

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
  createdAt: string;
  items?: OrderItem[];
}

export default function CustomerShippingPage() {
  const router = useRouter();
  const { user, piReady } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState("vi");

  const currentUser = user?.username || "guest_user";
  const isLoggedIn = !!user;

  // 🔹 Lấy ngôn ngữ từ localStorage (không dùng context hay hook khác)
  useEffect(() => {
    const lang = localStorage.getItem("titi_language") || "vi";
    setLanguage(lang);
  }, []);

  // 🔹 Nếu chưa login → chuyển về PiLogin
  useEffect(() => {
    if (piReady && !user) {
      router.replace("/pilogin");
    }
  }, [piReady, user, router]);

  // 🔹 Fetch orders
  useEffect(() => {
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }
    fetchOrders();
  }, [language, isLoggedIn]);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders", { cache: "no-store" });
      if (!res.ok) throw new Error("Lỗi tải đơn hàng");

      const data: Order[] = await res.json();

      const filterByLang =
        {
          vi: ["Đang giao"],
          en: ["Delivering"],
          zh: ["配送中"],
        }[language] || ["Đang giao"];

      const filtered = data.filter(
        (o) =>
          filterByLang.includes(o.status) &&
          o.buyer?.toLowerCase() === currentUser.toLowerCase()
      );
      setOrders(filtered);
    } catch (err) {
      console.error("❌ Lỗi tải đơn hàng:", err);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Loading
  if (loading) return <p className="text-center mt-6">⏳ Đang tải đơn hàng...</p>;

  // 🔒 Nếu chưa đăng nhập
  if (!isLoggedIn)
    return (
      <main className="p-6 text-center min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <h2 className="text-xl text-red-600 mb-3">🔐 Vui lòng đăng nhập bằng Pi Network</h2>
        <button
          onClick={() => router.push("/pilogin")}
          className="mt-3 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded"
        >
          👉 Đăng nhập ngay
        </button>
      </main>
    );

  // 🔢 Tính tổng
  const totalOrders = orders.length;
  const totalPi = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);

  return (
    <main className="p-4 max-w-4xl mx-auto bg-gray-50 min-h-screen pb-24">
      <div className="flex items-center mb-4">
        <button onClick={() => router.back()} className="text-orange-500 font-semibold text-lg mr-2">
          ←
        </button>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          🚚 Đơn hàng đang giao
        </h1>
      </div>

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

      {orders.length === 0 ? (
        <p className="text-center text-gray-500">
          Bạn chưa có đơn hàng nào đang giao.
          <br />👤 Tài khoản: <b>{currentUser}</b>
        </p>
      ) : (
        <div className="space-y-5">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition"
            >
              <div className="flex justify-between items-center mb-2">
                <h2 className="font-semibold text-lg">🧾 #{order.id}</h2>
                <span className="px-3 py-1 rounded text-sm font-medium bg-blue-100 text-blue-700">
                  {order.status}
                </span>
              </div>
              <p>👤 <b>Người mua:</b> {order.buyer}</p>
              <p>💰 <b>Tổng:</b> {order.total} Pi</p>
              <p>📅 <b>Ngày tạo:</b> {new Date(order.createdAt).toLocaleString()}</p>

              {order.items?.length > 0 && (
                <div className="mt-2">
                  <b>🧺 Sản phẩm:</b>
                  <ul className="ml-6 list-disc text-gray-700">
                    {order.items.map((item, idx) => (
                      <li key={idx}>
                        {item.name} — {item.price} Pi × {item.quantity}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="h-20"></div>
    </main>
  );
}
