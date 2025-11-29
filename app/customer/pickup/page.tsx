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

export default function PickupOrdersPage() {
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
  }, [user, language]);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders", { cache: "no-store" });
      const data: Order[] = await res.json();

      const filterByLang = {
        vi: ["Đang giao", "Chờ lấy hàng"],
        en: ["Delivering", "Waiting for pickup"],
        zh: ["配送中", "等待取货"],
      }[language];

      const filtered = data.filter(
        (o) =>
          filterByLang.includes(o.status) &&
          o.buyer.toLowerCase() === user!.username.toLowerCase()
      );

      setOrders(filtered);
    } catch (err) {
      console.error("❌ Lỗi tải đơn:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p className="text-center">⏳ Đang tải...</p>;
  if (!user) return <p className="text-center text-red-500">🔐 Vui lòng đăng nhập</p>;

  const totalOrders = orders.length;
  const totalPi = orders.reduce((sum, o) => sum + o.total, 0);

  return (
    <main className="p-4 max-w-4xl mx-auto bg-gray-50 min-h-screen">
      {/* UI giữ nguyên */}
      {/* ... */}
    </main>
  );
}
