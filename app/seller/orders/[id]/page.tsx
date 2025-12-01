"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

interface Order {
  id: number;
  buyerName: string;
  email: string;
  phone: string;
  address: string;
  country: string;
  province: string;
  total: number;
  status: string;
  createdAt: string;
}

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params); // 👈 FIX lỗi ở đây
  const { user } = useAuth();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/orders/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.error) {
          setOrder(null);
        } else {
          setOrder(data);
        }
        setLoading(false);
      })
      .catch(() => {
        setOrder(null);
        setLoading(false);
      });
  }, [id]);

  const printOrder = () => {
    window.print();
  };

  const downloadJSON = () => {
    if (!order) return;
    const blob = new Blob([JSON.stringify(order, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `order_${id}.json`;
    a.click();
  };

  if (loading)
    return (
      <p className="text-center mt-10 text-gray-500">⏳ Đang tải...</p>
    );

  if (!order)
    return (
      <p className="text-center mt-10 text-red-500">
        ❌ Không có dữ liệu.
      </p>
    );

  return (
    <main className="min-h-screen p-5 max-w-2xl mx-auto bg-white print:bg-white">
      <button
        onClick={() => router.back()}
        className="text-orange-500 text-lg mb-4"
      >
        ← Quay lại
      </button>

      <h1 className="text-2xl font-bold text-gray-800 mb-3">
        🧾 Chi tiết đơn hàng #{id}
      </h1>

      <div className="border p-4 rounded-lg shadow-sm space-y-2">
        <p><b>👤 Người mua:</b> {order.buyerName}</p>
        <p><b>📧 Email:</b> {order.email}</p>
        <p><b>📞 Số điện thoại:</b> {order.phone}</p>
        <p><b>🏠 Địa chỉ:</b> {order.address}</p>
        <p><b>🌍 Quốc gia:</b> {order.country}</p>
        <p><b>🏙 Tỉnh / Thành phố:</b> {order.province}</p>

        <hr className="my-3" />

        <p><b>💰 Tổng tiền:</b> {order.total} Pi</p>
        <p><b>📦 Trạng thái:</b> {order.status}</p>
        <p><b>📅 Ngày tạo:</b> {order.createdAt}</p>
      </div>

      <div className="mt-6 flex gap-3">
        <button
          onClick={downloadJSON}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          ⬇ Lưu về máy
        </button>

        <button
          onClick={printOrder}
          className="px-4 py-2 bg-green-600 text-white rounded"
        >
          🖨 In đơn
        </button>
      </div>
    </main>
  );
}
