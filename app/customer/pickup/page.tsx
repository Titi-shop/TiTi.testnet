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

  // ✅ Lấy thông tin đăng nhập từ localStorage
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
      const res = await fetch("/api/orders", { cache: "no-store" });
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
      <main className="p-6 text-center min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <h2 className="text-xl text-red-600 mb-3">
          🔐 {t("login_required") || "Vui lòng đăng nhập bằng Pi Network"}
        </h2>
        <button
          onClick={() => router.push("/pilogin")}
          className="btn-orange mt-3"
        >
          👉 {t("go_to_login") || "Đăng nhập ngay"}
        </button>
      </main>
    );

  // ✅ Tính tổng đơn và tổng Pi
  const totalOrders = orders.length;
  const totalPi = orders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);

  // ✅ Hiển thị danh sách đơn
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
          🚚{" "}
          {language === "vi"
            ? "Đơn hàng đang giao / chờ lấy hàng"
            : language === "en"
            ? "Orders being delivered / waiting for pickup"
            : "配送中 / 等待取货 的订单"}
        </h1>
      </div>

      {/* ===== Nội dung ===== */}
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
              <h2 className="font-semibold">🧾 #{order.id}</h2>
              <p>💰 {t("product_price")}: {order.total} Pi</p>
              <p>🚚 {t("update_status")}: {order.status}</p>

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

      {/* ===== Tổng đơn & Tổng Pi ===== */}
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
