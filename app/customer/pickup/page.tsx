"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext"; // 🔹 Import chính xác

export default function PickupOrdersPage() {
  const router = useRouter();
  const { user, piReady } = useAuth();

  // 🔹 Lấy hàm dịch và ngôn ngữ an toàn
  const { translate: t, language } = useLanguage() || { translate: (k: any) => k, language: "vi" };

  // 🔹 State giữ nguyên
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const currentUser = user?.username || "guest_user";
  const isLoggedIn = !!user;

  // 🔹 Kiểm tra login
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
      if (!res.ok) throw new Error("Không thể tải đơn hàng");

      const data = await res.json();

      // 🔹 Bộ lọc ngôn ngữ — KHÔNG gọi t() khi render build
      const filterByLang = {
        vi: ["Đang giao", "Chờ lấy hàng"],
        en: ["Delivering", "Waiting for pickup"],
        zh: ["配送中", "等待取货"],
      }[language] || ["Đang giao", "Chờ lấy hàng"];

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

  // 🕓 Loading
  if (loading)
    return <p className="text-center mt-6">{t("loading_orders") || "⏳ Đang tải đơn hàng..."}</p>;

  // 🔒 Nếu chưa login
  if (!isLoggedIn)
    return (
      <main className="p-6 text-center min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <h2 className="text-xl text-red-600 mb-3">{t("login_required") || "🔐 Vui lòng đăng nhập bằng Pi Network"}</h2>
        <button
          onClick={() => router.push("/pilogin")}
          className="mt-3 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded"
        >
          👉 {t("go_to_login") || "Đăng nhập ngay"}
        </button>
      </main>
    );

  // 📦 Tổng hợp đơn
  const totalOrders = orders.length;
  const totalPi = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);

  return (
    <main className="p-4 max-w-4xl mx-auto bg-gray-50 min-h-screen pb-24">
      {/* 🔹 Giữ nguyên UI chỉ đổi text sang t(...) */}
      <div className="flex items-center mb-4">
        <button onClick={() => router.back()} className="text-orange-500 font-semibold text-lg mr-2">
          ←
        </button>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          📦 {t("pickup_orders") || "Tổng đơn hàng đang giao / chờ lấy"}
        </h1>
      </div>

      {/* 🔹 Tổng đơn */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white border rounded-lg p-4 text-center shadow">
          <p className="text-gray-500 text-sm">{t("total_orders") || "Tổng đơn"}</p>
          <p className="text-2xl font-bold text-gray-800">{totalOrders}</p>
        </div>
        <div className="bg-white border rounded-lg p-4 text-center shadow">
          <p className="text-gray-500 text-sm">{t("total_pi") || "Tổng Pi"}</p>
          <p className="text-2xl font-bold text-gray-800">{totalPi.toFixed(2)} Pi</p>
        </div>
      </div>

      {/* 🔹 Danh sách đơn */}
      {orders.length === 0 ? (
        <p className="text-center text-gray-500">
          {t("no_pickup_orders") || "Bạn chưa có đơn hàng nào đang giao hoặc chờ lấy."}
          <br />👤 <b>{currentUser}</b>
        </p>
      ) : (
        <div className="space-y-5">
          {orders.map((order) => (
            <div key={order.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition">
              <p>🧾 <b>{t("order_code") || "Mã đơn"}:</b> #{order.id}</p>
              <p>👤 <b>{t("buyer") || "Người mua"}:</b> {order.buyer}</p>
              <p>💰 <b>{t("total") || "Tổng"}:</b> {order.total} Pi</p>
              <p>📅 <b>{t("created_at") || "Ngày tạo"}:</b> {order.createdAt}</p>
              <p>📊 <b>{t("status") || "Trạng thái"}:</b> {order.status}</p>
            </div>
          ))}
        </div>
      )}

      <div className="h-20"></div>
    </main>
  );
}
