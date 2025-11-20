"use client";
import { useEffect, useState } from "react";

export default function PiTest() {
  const [status, setStatus] = useState("🔹 Pi SDK ready...");
  const [PiSDK, setPiSDK] = useState<any>(null);

  // ❗ Chỉ gán window.Pi khi chạy trên client
  useEffect(() => {
    if (typeof window !== "undefined" && window.Pi) {
      setPiSDK(window.Pi);
    } else {
      setStatus("⚠️ Không tìm thấy Pi SDK — Hãy mở bằng Pi Browser");
    }
  }, []);

  const login = async () => {
    if (!PiSDK) {
      alert("⚠️ Pi SDK chưa sẵn sàng!");
      return;
    }
    try {
      const scopes = ["username", "payments"];
      const auth = await PiSDK.authenticate(scopes, (payment: any) => {
        console.log("⚠️ Có giao dịch pending:", payment);
        setStatus("⚠️ Bạn đang có giao dịch pending cần xử lý!");
      });
      alert(`✅ Login thành công: ${auth.user.username}`);
    } catch (err: any) {
      alert("❌ Lỗi đăng nhập: " + err.message);
    }
  };

  const pay = async () => {
    if (!PiSDK) {
      alert("⚠️ Pi SDK chưa sẵn sàng!");
      return;
    }

    setStatus("⏳ Đang tạo giao dịch...");
    try {
      const payment = {
        amount: 0.01,
        memo: "Test thanh toán 0.01 Pi",
        metadata: { reason: "SDK test" },
      };

      const callbacks = {
        onReadyForServerApproval: async (pid: string) => {
          setStatus("🔎 Approving...");
          await fetch("/api/pi/approve", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentId: pid }),
          });
        },
        onReadyForServerCompletion: async (pid: string, txid: string) => {
          setStatus("💰 Completing...");
          await fetch("/api/pi/complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentId: pid, txid }),
          });
          alert("🎉 Thanh toán thành công!");
        },
        onCancel: () => setStatus("🚫 Đã hủy giao dịch."),
        onError: (err: any) => setStatus("❌ Lỗi: " + err.message),
      };

      // Kiểm tra pending payment
      if (PiSDK.getPaymentPending) {
        const pending = await PiSDK.getPaymentPending();
        if (pending) {
          setStatus("⚠️ Có giao dịch pending, cần xử lý trước khi tạo mới!");
          return;
        }
      }

      PiSDK.createPayment(payment, callbacks);
    } catch (err: any) {
      setStatus("❌ Lỗi khi tạo giao dịch: " + err.message);
    }
  };

  return (
    <div className="p-6 text-center">
      <h1 className="text-2xl font-bold text-purple-700 mb-4">🧪 Test Pi Payment</h1>
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
