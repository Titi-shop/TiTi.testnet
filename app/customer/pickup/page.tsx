"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from 'next-intl';
import { useAuth } from "@/context/AuthContext"; // 👉 import AuthContext

export default function PickupOrdersPage() {
  const router = useRouter();
  const t = useTranslations();
  // 👉 Dùng AuthContext thay cho localStorage
  const { user, pilogin, loading: authLoading } = useAuth();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 👉 Lấy username đúng từ AuthContext (không dùng localStorage nữa)
  const currentUser = user?.username || "";

  // 🚀 Tải đơn hàng khi đã có user và không còn loading Auth
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setLoading(false);
      return;
    }

    fetchOrders();
  }, [language, user, authLoading]);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders", { 
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${user?.accessToken}`, // 👉 gửi đúng token
        },
      });

      const data = await res.json();
      const filterByLang = {
        vi: ["Đang giao", "Chờ lấy hàng"],
        en: ["Delivering", "Waiting for pickup"],
        zh: ["配送中", "等待取货"],
      }[language];

      const filtered = data.filter(
        (o: any) =>
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

  // 🕓 Đang load trạng thái đăng nhập
  if (authLoading || loading) {
    return <p className="text-center mt-6">⏳ Đang tải đơn hàng...</p>;
  }

  // ❌ Nếu chưa đăng nhập → yêu cầu login (giữ nguyên giao diện)
  if (!user) {
    return (
      <main className="p-6 text-center min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <h2 className="text-xl text-red-600 mb-3">
          🔐 Vui lòng đăng nhập bằng Pi Network
        </h2>
        <button
          onClick={pilogin}
          className="mt-3 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded"
        >
          👉 Đăng nhập với Pi Network
        </button>
      </main>
    );
  }

  // 📊 Tính tổng đơn & tổng Pi
  const totalOrders = orders.length;
  const totalPi = orders.reduce(
    (sum, o) => sum + (parseFloat(o.total) || 0),
    0
  );

  // 🎨⭐ GIỮ NGUYÊN TOÀN BỘ GIAO DIỆN BÊN DƯỚI KHÔNG THAY ĐỔI ⭐🎨
  return (
    <main className="p-4 max-w-4xl mx-auto bg-gray-50 min-h-screen pb-24">
      {/* ===== Nút quay lại + tiêu đề ===== */}
      <div className="flex items-center mb-4">
        <button
          onClick={() => router.back()}
          className="text-orange-500 font-semibold text-lg mr-2"
        >
          ←
        </button>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          📦 Tổng đơn hàng
        </h1>
      </div>

      {/* ===== Khối tổng ===== */}
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

      {/* ===== Danh sách đơn ===== */}
      {orders.length === 0 ? (
        <p className="text-center text-gray-500">
          Bạn chưa có đơn hàng nào đang giao hoặc chờ lấy.
          <br />
          👤 Người dùng: <b>{currentUser}</b>
        </p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition"
            >
              <p>🧾 <b>Mã đơn:</b> #{order.id}</p>
              <p>👤 <b>Người mua:</b> {order.buyer}</p>
              <p>💰 <b>Tổng:</b> {order.total} Pi</p>
              <p>📅 <b>Ngày tạo:</b> {order.createdAt}</p>
              <p>📊 <b>Trạng thái:</b> {order.status}</p>

              <ul className="mt-2 text-sm">
                {order.items?.map((item: any, i: number) => (
                  <li key={i}>
                    • {item.name} — {item.price} Pi × {item.quantity || 1}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* ===== Đệm chống che chân ===== */}
      <div className="h-20"></div>
    </main>
  );
}
