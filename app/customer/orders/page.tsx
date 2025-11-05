"use client";
import { Toaster } from "react-hot-toast";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLanguage } from "../../context/LanguageContext";

export default function CustomerOrdersPage() {
  const { translate } = useLanguage();
  return (
    <Suspense fallback={<p className="p-6 text-center">{translate("loading_orders") || "⏳ Đang tải đơn hàng..."}</p>}>
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
  const { translate, language } = useLanguage();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<string>("");

  // ✅ Lấy username từ Pi login (đồng bộ với pilogin/page.tsx)
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

  // ✅ Map trạng thái nội bộ theo ngôn ngữ
  const mapStatus: Record<string, string> = {
    "cho-xac-nhan": translate("waiting_confirm") || "Chờ xác nhận",
    "cho-lay-hang": translate("waiting_pickup") || "Chờ lấy hàng",
    "cho-giao-hang": translate("delivering") || "Đang giao",
    "danh-gia": translate("review") || "Đánh giá",
  };

  // ✅ Tải đơn hàng theo username + trạng thái
  useEffect(() => {
    const loadOrders = async () => {
      if (!currentUser || currentUser === "guest_user") {
        console.warn("⚠️ Người dùng chưa đăng nhập — bỏ qua tải đơn hàng.");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/orders");
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

  if (loading)
    return <p className="p-6 text-center">{translate("loading") || "⏳ Đang tải..."}</p>;

  if (!orders.length)
    return (
      <p className="p-6 text-center text-gray-500">
        {translate("no_orders") || "❗ Không có đơn hàng nào."} <br />
        👤 {translate("current_user") || "Người dùng"}: <b>{currentUser}</b>
      </p>
    );

  return (
    <div className="p-6 space-y-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-orange-600 text-center">
        📦 {translate("my_orders") || "Đơn hàng của bạn"}
      </h1>
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
          <ul className="ml-5 list-disc">
            {o.items.map((it: any, i: number) => (
              <li key={i}>
                {it.name} — {it.price} Pi × {it.quantity || 1}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
