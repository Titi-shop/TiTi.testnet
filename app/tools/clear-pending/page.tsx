"use client";

import { useState } from "react";

export default function ClearPendingPage() {
  const [paymentId, setPaymentId] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCancel = async () => {
    if (!paymentId.trim()) {
      alert("⚠️ Vui lòng nhập paymentId!");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/pi/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId: paymentId.trim() }),
      });

      const text = await res.text();
      setMessage(`✅ Kết quả: ${text}`);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Lỗi không xác định";
      setMessage(`💥 Lỗi: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-md mx-auto p-6 bg-gray-50 min-h-screen">
      <h1 className="text-xl font-bold text-center mb-4">
        🧹 Huỷ giao dịch Pi đang pending
      </h1>

      <p className="text-gray-600 text-sm mb-4">
        Nếu bạn bị lỗi{" "}
        <strong>
          &quot;A pending payment needs to be handled&quot;
        </strong>
        , hãy dán mã <code>paymentId</code> vào ô dưới.
      </p>

      <input
        value={paymentId}
        onChange={(e) => setPaymentId(e.target.value)}
        className="w-full border rounded px-3 py-2 mb-3"
        placeholder="Nhập paymentId..."
      />

      <button
        onClick={handleCancel}
        disabled={loading}
        className="w-full py-3 rounded bg-orange-600 text-white"
      >
        {loading ? "Đang huỷ..." : "Huỷ giao dịch"}
      </button>

      {message && (
        <div className="mt-4 p-3 border bg-white text-sm">
          {message}
        </div>
      )}
    </main>
  );
}
