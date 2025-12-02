"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, Upload, Send } from "lucide-react";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";

interface Order {
  id: string;
  status: string;
}

export default function ReturnPage() {
  const router = useRouter();
  const { user, loading, piReady, pilogin } = useAuth();
  const { t } = useTranslation();

  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // 🟢 Lấy danh sách đơn hàng của user
  useEffect(() => {
    const username = user?.username || localStorage.getItem("titi_username");
    if (!username) return;

    fetch(`/api/orders?username=${username}`)
      .then((res) => res.json())
      .then((data) => setOrders(data.orders || []))
      .catch(() => console.warn(t.load_orders_failed));
  }, [user, t.load_orders_failed]);

  // 📸 Upload hình ảnh minh chứng
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "x-filename": file.name },
        body: file,
      });
      const data = await res.json();
      if (data.url) setImages((prev) => [...prev, data.url]);
    } catch {
      alert(t.upload_error);
    } finally {
      setUploading(false);
    }
  };

  // 📤 Gửi yêu cầu trả hàng
  const handleSubmit = async () => {
    if (!selectedOrder || !reason) {
      alert(t.warning_select_order_and_reason);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: user?.username || localStorage.getItem("titi_username"),
          orderId: selectedOrder,
          reason,
          images,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(t.submit_success);
        setReason("");
        setImages([]);
        setSelectedOrder("");
      } else {
        alert(`${t.submit_failed}: ${data.message || ""}`);
      }
    } catch {
      alert(t.server_error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return <p className="text-center mt-10 text-gray-500">⏳ {t.loading}</p>;

  if (!user)
    return (
      <main className="p-4 text-center">
        <p className="text-red-500">{t.login_required}</p>
        {piReady && (
          <button
            onClick={pilogin}
            className="mt-4 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded"
          >
            🔐 {t.login_now}
          </button>
        )}
      </main>
    );

  return (
    <main className="min-h-screen bg-gray-50 pb-10">
      {/* ===== Tiêu đề ===== */}
      <div className="flex items-center bg-white p-4 shadow-sm">
        <button
          onClick={() => router.back()}
          className="text-gray-600 hover:text-orange-500"
        >
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-lg font-semibold text-gray-800 mx-auto">
          {t.return_request}
        </h1>
      </div>

      {/* ===== Chọn đơn hàng ===== */}
      <div className="p-4">
        <label className="font-semibold">{t.select_order}:</label>
        <select
          className="block w-full border p-2 rounded mt-2"
          value={selectedOrder}
          onChange={(e) => setSelectedOrder(e.target.value)}
        >
          <option value="">{t.select_order_placeholder}</option>
          {orders.map((order) => (
            <option key={order.id} value={order.id}>
              {order.id} - {order.status}
            </option>
          ))}
        </select>
      </div>

      {/* ===== Lý do ===== */}
      <div className="p-4">
        <label className="font-semibold">{t.return_reason}:</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full border p-2 rounded mt-2"
          rows={4}
          placeholder={t.reason_placeholder}
        />
      </div>

      {/* ===== Upload ảnh ===== */}
      <div className="p-4">
        <label className="font-semibold">{t.proof_images}:</label>
        <div className="flex items-center gap-3 mt-2">
          <label
            htmlFor="upload-image"
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded flex items-center gap-2 cursor-pointer"
          >
            <Upload size={18} /> {uploading ? t.uploading : t.upload_image}
          </label>
          <input
            id="upload-image"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleUpload}
          />
        </div>
        {images.length > 0 && (
          <div className="flex gap-3 mt-3 flex-wrap">
            {images.map((url, i) => (
              <img
                key={i}
                src={url}
                alt="uploaded"
                className="w-20 h-20 rounded object-cover border"
              />
            ))}
          </div>
        )}
      </div>

      {/* ===== Nút gửi ===== */}
      <div className="flex justify-center mt-6">
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className={`${
            submitting ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"
          } text-white font-semibold py-2 px-6 rounded flex items-center gap-2`}
        >
          <Send size={18} />
          {submitting ? t.sending : t.send_request}
        </button>
      </div>
    </main>
  );
}
