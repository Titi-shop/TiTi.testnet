"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useLanguage } from "../../context/LanguageContext";

export default function CustomerOrdersPage() {
  const { translate } = useLanguage();

  return (
    <Suspense
      fallback={
        <p className="p-6 text-center">
          {translate("loading_orders") || "⏳ Đang tải đơn hàng..."}
        </p>
      }
    >
      <OrdersWrapper />
    </Suspense>
  );
}

function OrdersWrapper() {
  const params = useSearchParams();
  const statusParam = params?.get("status") ?? null;
  return <OrdersContent statusParam={statusParam} />;
}

function OrdersContent({ statusParam }: { statusParam: string | null }) {
  const router = useRouter();
  const { translate, language } = useLanguage();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<string>("guest_user");

  // ✅ Lấy username từ Pi login
  useEffect(() => {
    try {
      const stored = localStorage.getItem("pi_user");
      const isLoggedIn = localStorage.getItem("titi_is_logged_in");

      if (stored && isLoggedIn === "true") {
        const parsed = JSON.parse(stored);
        const username = parsed?.user?.username || parsed?.username || "guest_user";
        setCurrentUser(username);
      } else {
        setCurrentUser("guest_user");
      }
    } catch (err) {
      console.error("❌ Lỗi đọc pi_user:", err);
      setCurrentUser("guest_user");
    }
  }, []);

  // ✅ Map trạng thái theo ngôn ngữ
  const mapStatus: Record<string, string> = {
    "cho-xac-nhan": translate("waiting_confirm") || "Chờ xác nhận",
    "cho-lay-hang": translate("waiting_pickup") || "Chờ lấy hàng",
    "cho-giao-hang": translate("delivering") || "Đang giao",
    "danh-gia": translate("review") || "Đánh giá",
  };

  // ✅ Tải đơn hàng
  useEffect(() => {
    const loadOrders = async () => {
      if (!currentUser || currentUser === "guest_user") {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch("/api/orders", { cache: "no-store" });
        if (!res.ok) throw new Error("Không thể tải đơn hàng.");
        const data = await res.json();

        const filtered = data.filter(
          (o: any) =>
            o.buyer?.toLowerCase() === currentUser.toLowerCase() &&
            (statusParam ? o.status === mapStatus[statusParam] : true)
        );
        setOrders(filtered);
      } catch (err) {
        console.error("❌ Lỗi khi tải đơn hàng:", err);
      } finally {
        setLoading(false);
      }
    };
    loadOrders();
  }, [statusParam, language, currentUser]);

  // ✅ Khi đang tải
  if (loading)
    return (
      <p className="p-6 text-center text-gray-500">
        {translate("loading") || "⏳ Đang tải..."}
      </p>
    );

  // ✅ Không có đơn hàng
  if (!orders.length)
    return (
      <main className="p-6 text-center bg-gray-50 min-h-screen">
        <button
          onClick={() => router.back()}
          className="text-orange-500 font-semibold text-lg mb-3"
        >
          ←
        </button>
        <h2 className="text-gray-500">
          {translate("no_orders") || "❗ Không có đơn hàng nào."}
        </h2>
        <p className="mt-2">
          👤 {translate("current_user") || "Người dùng"}:{" "}
          <b>{currentUser}</b>
        </p>
      </main>
    );

  // ✅ Tổng đơn & tổng Pi
  const totalOrders = orders.length;
  const totalPi = orders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);

  return (
    <main className="p-6 max-w-4xl mx-auto min-h-screen pb-24 bg-gray-50">
      {/* ===== Nút quay lại ===== */}
      <div className="flex items-center mb-4">
        <button
          onClick={() => router.back()}
          className="text-orange-500 font-semibold text-lg mr-2"
        >
          ←
        </button>
        <h1 className="text-2xl font-bold text-orange-600">
          📦 {translate("my_orders") || "Đơn hàng của bạn"}
        </h1>
      </div>

      {/* ===== Danh sách đơn ===== */}
      <div className="space-y-4">
        {orders.map((o) => (
          <div
            key={o.id}
            className="border rounded p-4 bg-white shadow hover:shadow-md transition"
          >
            <p>
              <b>{translate("order_code") || "Mã đơn"}:</b> {o.id}
            </p>
            <p>
              <b>{translate("status") || "Trạng thái"}:</b> {o.status}
            </p>
            <p>
              <b>{translate("total_amount") || "Tổng tiền"}:</b> {o.total} Pi
            </p>
            <ul className="ml-5 list-disc text-sm mt-2">
              {o.items?.map((it: any, i: number) => (
                <li key={i}>
                  {it.name} — {it.price} Pi × {it.quantity || 1}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* ===== Tổng kết ===== */}
      <div className="mt-8 border-t pt-4 text-center">
        <p className="text-gray-600">
          🧾 <b>Tổng đơn:</b> {totalOrders}
        </p>
        <p className="text-gray-600">
          💰 <b>Tổng Pi:</b> {totalPi.toFixed(2)} Pi
        </p>
      </div>

      {/* ===== Đệm chống che phần chân ===== */}
      <div className="h-20"></div>
    </main>
  );
}
