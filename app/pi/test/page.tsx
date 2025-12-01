"use client";
import { useState } from "react";

export default function PiTest() {
  const [status, setStatus] = useState("🔹 Pi SDK ready...");

  const login = async () => {
    try {
      const scopes = ["username", "payments"];
      const auth = await window.Pi.authenticate(scopes, (payment) => {
        console.log("⚠️ Có giao dịch pending:", payment);
        setStatus("⚠️ Bạn đang có giao dịch pending cần xử lý!");
      });
      alert(`✅ Login thành công: ${auth.user.username}`);
    } catch (err) {
      alert("❌ Lỗi đăng nhập: " + err.message);
    }
  };

  const pay = async () => {
    setStatus("⏳ Đang tạo giao dịch...");
    try {
      const payment = {
        amount: 0.01,
        memo: "Test thanh toán 0.01 Pi",
        metadata: { reason: "SDK test" },
      };

      const callbacks = {
        onReadyForServerApproval: async (pid) => {
          setStatus("✅ Approving...");
          await fetch("/api/pi/approve", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentId: pid }),
          });
        },
        onReadyForServerCompletion: async (pid, txid) => {
          setStatus("💰 Completing...");
          await fetch("/api/pi/complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentId: pid, txid }),
          });
          alert("🎉 Thanh toán thành công!");
        },
        onCancel: () => setStatus("🚫 Đã hủy giao dịch."),
        onError: (err) => setStatus("❌ Lỗi: " + err.message),
      };

      // ⚡ Thêm xử lý pending payment trước khi tạo payment mới
      if (window.Pi?.getPaymentPending) {
        const pending = await window.Pi.getPaymentPending();
        if (pending) {
          setStatus("⚠️ Có giao dịch pending, cần xử lý trước khi tạo mới!");
          return;
        }
      }

      window.Pi.createPayment(payment, callbacks);
    } catch (err) {
      setStatus("❌ Lỗi khi tạo giao dịch: " + err.message);
    }
  };

  return (
    <div className="p-6 text-center">
      <h1 className="text-2xl font-bold text-purple-700 mb-4">
        🧪 Test Pi Payment
      </h1>
      <button
        onClick={login}
        className="bg-orange-500 text-white px-4 py-2 rounded m-2"
      >
        🔑 Login Pi
      </button>
      <button
        onClick={pay}
        className="bg-purple-600 text-white px-4 py-2 rounded m-2"
      >
        💳 Pay 0.01 Pi
      </button>
      <p className="mt-4">{status}</p>
    </div>
  );
}
