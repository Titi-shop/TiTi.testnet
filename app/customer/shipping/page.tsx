"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/app/lib/i18n";

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
  const { t, lang } = useTranslation();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const currentUser = user?.username || "guest_user";
  const isLoggedIn = !!user;

  // 🔐 Chuyển hướng nếu chưa đăng nhập
  useEffect(() => {
    if (piReady && !user) {
      router.replace("/pilogin");
    }
  }, [piReady, user, router]);

  // 📦 Load đơn hàng
  useEffect(() => {
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }
    fetchOrders();
  }, [lang, isLoggedIn]);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders", { cache: "no-store" });
      if (!res.ok) throw new Error(t["error_load_orders"]);

      const data: Order[] = await res.json();

      const filterByLang = {
        vi: ["Đang giao", "Đang vận chuyển"],
        en: ["Delivering", "Shipping"],
        zh: ["配送中", "运输中"],
        ko: ["배송 중"],
        th: ["กำลังจัดส่ง"],
        fr: ["En livraison"],
        ar: ["قيد الشحن"],
        ru: ["В пути"],
        de: ["Lieferung"],
        pt: ["Enviando"],
        hi: ["भेजा जा रहा है"],
        ja: ["配送中"],
      }[lang] || ["Delivering"];

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

  // 🟢 Xác nhận đã nhận hàng
  const confirmReceived = async (id: number) => {
    if (!confirm(t["confirm_received_message"])) return;

    try {
      await fetch("/api/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          status: t["status_completed"] || "Hoàn tất",
          buyer: currentUser,
        }),
      });

      alert(t["thanks_receive"]);
      fetchOrders();
    } catch {
      alert(t["error_confirm"]);
    }
  };

  // ⏳ Loading
  if (loading)
    return <p className="text-center mt-6 text-gray-500">{t["loading_orders"]}</p>;

  // 🔐 Chưa đăng nhập
  if (!isLoggedIn)
    return (
      <main className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-gray-50">
        <h2 className="text-xl text-red-600 mb-3">{t["login_required"]}</h2>
        <button
          onClick={() => router.push("/pilogin")}
          className="mt-3 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded"
        >
          👉 {t["go_to_login"]}
        </button>
      </main>
    );

  // 📊 Tổng đơn & Pi
  const totalOrders = orders.length;
  const totalPi = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);

  return (
    <main className="p-4 max-w-4xl mx-auto bg-gray-50 min-h-screen pb-24">
      {/* ===== Thanh tiêu đề ===== */}
      <div className="flex items-center mb-4">
        <button
          onClick={() => router.back()}
          className="text-orange-500 font-semibold text-lg mr-2"
        >
          ←
        </button>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          🚚 {t["shipping_orders"]}
        </h1>
      </div>

      {/* ===== Thống kê nhanh ===== */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white border rounded-lg p-4 text-center shadow">
          <p className="text-gray-500 text-sm">{t["total_orders"]}</p>
          <p className="text-2xl font-bold text-gray-800">{totalOrders}</p>
        </div>
        <div className="bg-white border rounded-lg p-4 text-center shadow">
          <p className="text-gray-500 text-sm">{t["total_pi"]}</p>
          <p className="text-2xl font-bold text-gray-800">{totalPi.toFixed(2)} Pi</p>
        </div>
      </div>

      {/* ===== Danh sách đơn ===== */}
      {orders.length === 0 ? (
        <p className="text-center text-gray-500">
          {t["no_shipping_orders"]}
          <br />👤 {t["current_user"]}: <b>{currentUser}</b>
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

              <p>👤 <b>{t["buyer"]}:</b> {order.buyer}</p>
              <p>💰 <b>{t["total"]}:</b> {order.total} Pi</p>
              <p>📅 <b>{t["created_at"]}:</b> {new Date(order.createdAt).toLocaleString()}</p>

              <button
                onClick={() => confirmReceived(order.id)}
                className="mt-3 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                {t["confirm_received"]}
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
