"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "../../context/LanguageContext";

export default function PickupOrdersPage() {
  const router = useRouter();
  const { translate: t, language } = useLanguage();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<string>("guest_user");
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  // ✅ Lấy thông tin đăng nhập từ localStorage (đồng bộ với Pi Login)
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
      console.error("❌ Lỗi khi đọc thông tin Pi login:", err);
      setIsLoggedIn(false);
    }
  }, []);

  // ✅ Tải đơn hàng của người dùng hiện tại
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
      if (!res.ok) throw new Error("Không thể tải danh sách đơn hàng.");

      const data = await res.json();

      // ✅ Lọc đơn hàng theo ngôn ngữ và người mua
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
    } catch (error) {
      console.error("❌ Lỗi tải đơn hàng:", error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Nếu đang tải
  if (loading)
    return (
      <p className="text-center mt-6">
        ⏳ {t("loading") || "Đang tải đơn hàng..."}
      </p>
    );

  // ✅ Nếu chưa đăng nhập
  if (!isLoggedIn)
    return (
      <main className="p-6 text-center">
        <h2 className="text-xl text-red-600 mb-3">
          🔐 {t("login_required") || "Vui lòng đăng nhập bằng Pi Network"}
        </h2>
        <button
          onClick={() => router.push("/pilogin")}
          className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          👉 {t("go_to_login") || "Đăng nhập ngay"}
        </button>
      </main>
    );

  // ✅ Hiển thị danh sách đơn
  return (
    <main className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-center text-orange-600">
        🚚{" "}
        {language === "vi"
          ? "Đơn hàng đang giao / chờ lấy hàng"
          : language === "en"
          ? "Orders being delivered / waiting for pickup"
          : "配送中 / 等待取货 的订单"}
      </h1>

      {orders.length === 0 ? (
        <p className="text-center text-gray-500">
          {language === "vi"
            ? "Bạn chưa có đơn hàng nào đang giao hoặc chờ lấy."
            : language === "en"
            ? "You have no orders currently delivering or waiting for pickup."
            : "您当前没有正在配送或等待取货的订单。"}
          <br />
          👤 {t("current_user") || "Tài khoản"}: <b>{currentUser}</b>
        </p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="border p-4 rounded bg-white shadow hover:shadow-md transition"
            >
              <h2 className="font-semibold">🧾 {t("my_orders")}: #{order.id}</h2>
              <p>
                💰 {t("product_price")}: {order.total} Pi
              </p>
              <p>
                🚚 {t("update_status")}: {order.status}
              </p>

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
    </main>
  );
}
