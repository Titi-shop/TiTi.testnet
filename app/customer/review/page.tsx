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
  reviewed?: boolean;
  createdAt: string;
  items?: OrderItem[];
}

export default function ReviewPage() {
  const router = useRouter();
  const { user, piReady } = useAuth();

  const translate = (key: string) => key;

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRating, setSelectedRating] = useState<Record<number, number>>({});
  const [comments, setComments] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState<number | null>(null);

  useEffect(() => {
    if (!piReady || !user) {
      setLoading(false);
      return;
    }

    const fetchOrders = async () => {
      const res = await fetch("/api/orders", { cache: "no-store" });
      const data: Order[] = await res.json();

      const filtered = data.filter(
        (o) =>
          o.status === "Hoàn tất" &&
          !o.reviewed &&
          o.buyer.toLowerCase() === user.username.toLowerCase()
      );
      setOrders(filtered);
      setLoading(false);
    };
    fetchOrders();
  }, [piReady, user]);

  const handleSubmitReview = async (orderId: number) => {
    const rating = selectedRating[orderId];
    const comment = comments[orderId] || "";
    if (!rating) return alert("Vui lòng chọn số sao!");

    setSubmitting(orderId);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, rating, comment, username: user!.username }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      alert("Đánh giá thành công!");
    } catch (err) {
      console.error("❌", err);
    } finally {
      setSubmitting(null);
    }
  };

  if (loading) return <p>⏳ Đang tải...</p>;
  if (!user) return <p>🔐 Vui lòng đăng nhập</p>;

  return (
    <main className="p-4 max-w-4xl mx-auto bg-gray-50">
      {/* UI giữ nguyên */}
      {/* ... */}
    </main>
  );
}
