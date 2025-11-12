"use client";
import { useRouter } from "next/navigation";

export default function OrdersTabs() {
  const router = useRouter();

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      <button onClick={() => router.push("/seller/orders")} className="btn-gray">
        all
      </button>
      <button onClick={() => router.push("/seller/orders/pending")} className="btn-gray">
        Chờ xác nhận
      </button>
      <button onClick={() => router.push("/seller/orders/shipping")} className="btn-gray">
        Đang giao
      </button>
      <button onClick={() => router.push("/seller/orders/completed")} className="btn-gray">
        Hoàn tất
      </button>
      <button onClick={() => router.push("/seller/orders/canceled")} className="btn-gray">
        Đã hủy
      </button>

      {/* ✅ Nút mới */}
      <button onClick={() => router.push("/seller/orders/returned")} className="btn-gray">
        Hoàn lại
      </button>
    </div>
  );
}
