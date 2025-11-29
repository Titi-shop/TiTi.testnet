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
  note?: string;
  createdAt: string;
  items: OrderItem[];
}

export default function PendingOrdersPage() {
  const router = useRouter();
  const { user } = useAuth(); // 🔹 lấy user từ AuthContext

  const translate = (key: string) => key;
  const language = "vi"; // 🔹 Bạn có thể mở rộng logic đa ngôn ngữ sau

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);

  // 🔹 Nếu không có user => không fetch
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchOrders = async () => {
      try {
        const res = await fetch("/api/orders", { cache: "no-store" });
        const data: Order[] = await res.json();

        const filterByLang = {
          vi: ["Chờ xác nhận", "Đã thanh toán", "Chờ xác minh"],
          en: ["Pending", "Paid", "Waiting for verification"],
          zh: ["待确认", "已付款", "待核实"],
        }[language];

        const filtered = data.filter(
          (o) =>
            o.buyer.toLowerCase() === user.username.toLowerCase() &&
            filterByLang.includes(o.status)
        );
        setOrders(filtered);
      } catch (err) {
        console.error("❌ Lỗi tải đơn:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [user, language]);

  const handleCancel = async (orderId: number) => {
    if (!confirm("❓ Bạn có chắc muốn hủy đơn hàng này không?")) return;
    setProcessing(orderId);
    try {
      const res = await fetch(`/api/orders/cancel?id=${orderId}`, {
        method: "POST",
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);

      alert("✅ Đã hủy thành công!");
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    } catch (err) {
      console.error("❌ Hủy đơn thất bại");
    } finally {
      setProcessing(null);
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
