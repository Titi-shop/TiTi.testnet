"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "@/app/lib/i18n";
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
  const { user } = useAuth();

  const translate = (key: string) => key;
  const language = "vi";

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    fetchOrders();
  }, [language, user]);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders", { cache: "no-store" });
      const data: Order[] = await res.json();

      const filterByLang = {
        vi: ["Đang giao"],
        en: ["Delivering"],
        zh: ["配送中"],
      }[language];

      const filtered = data.filter(
        (o) =>
          filterByLang.includes(o.status) &&
          o.buyer.toLowerCase() === user.username.toLowerCase()
      );

      setOrders(filtered);
    } catch {
      console.error("❌ Lỗi tải đơn");
    } finally {
      setLoading(false);
    }
  };

  const confirmReceived = async (id: number) => {
    if (!confirm("Bạn đã nhận được hàng?")) return;
    await fetch("/api/orders", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "Hoàn tất", buyer: user?.username }),
    });
    alert("Cảm ơn bạn đã xác nhận!");
    fetchOrders();
  };

  if (loading) return <p className="text-center mt-6">⏳ Đang tải...</p>;
  if (!user)
    return (
      <p className="text-center text-red-500 mt-10">
        🔐 Vui lòng đăng nhập bằng Pi Network
      </p>
    );

  const totalPi = orders.reduce((sum, o) => sum + o.total, 0);

  return (
    <main className="p-4 max-w-4xl mx-auto bg-gray-50 min-h-screen">
      {/* UI giữ nguyên */}
      {/* ... */}
    </main>
  );
}
