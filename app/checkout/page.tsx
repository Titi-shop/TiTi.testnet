"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "../context/CartContext";

declare global {
  interface Window {
    Pi?: any;
    Pi_initialized?: boolean;
  }
}

export default function CheckoutPage() {
  const { cart, clearCart, total } = useCart();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handlePay = async () => {
    if (!window.Pi) {
      alert("⚠️ Mở bằng Pi Browser để thanh toán!");
      return;
    }

    const user = JSON.parse(localStorage.getItem("pi_user") || "{}");
    if (!user?.username) {
      alert("🔑 Cần đăng nhập Pi trước khi thanh toán!");
      router.push("/pilogin");
      return;
    }

    setLoading(true);
    try {
      if (!window.Pi_initialized) {
        const sandbox = process.env.NEXT_PUBLIC_PI_ENV === "sandbox";
        await window.Pi.init({ version: "2.0", sandbox: false })
        console.log("✅ Pi SDK initialized");
      }

      const orderId = `ORD-${Date.now()}`;
      const paymentData = {
        amount: total.toFixed(2),
        memo: `Thanh toán đơn hàng #${orderId}`,
        metadata: { orderId, buyer: user.username, cart },
      };

      // 1️⃣ Gọi backend để tạo payment
      const createRes = await fetch("/api/pi/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentData),
      });
      const payment = await createRes.json();

      // 2️⃣ Định nghĩa callback
      const callbacks = {
        onReadyForServerApproval: async (paymentId: string) => {
          await fetch("/api/pi/approve", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentId }),
          });
        },
        onReadyForServerCompletion: async (paymentId: string, txid: string) => {
          await fetch("/api/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: orderId,
              buyer: user.username,
              total,
              items: cart,
              txid,
              status: "Đã thanh toán",
              createdAt: new Date().toISOString(),
            }),
          });

          await fetch("/api/pi/complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentId, txid }),
          });

          clearCart();
          alert("🎉 Thanh toán thành công!");
          router.push("/customer/pending");
        },
        onCancel: async (paymentId: string) => {
          await fetch("/api/pi/cancel", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentId }),
          });
          alert("❌ Giao dịch bị hủy!");
        },
        onError: (error: any) => {
          console.error(error);
          alert("💥 Lỗi: " + error.message);
        },
      };

      // 3️⃣ Gọi thanh toán thật trên Pi Wallet Testnet
      await window.Pi.createPayment(paymentData, callbacks);
    } catch (err: any) {
      console.error("💥 Thanh toán thất bại:", err);
      alert("❌ " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-4">
      <h1 className="text-xl font-bold mb-4">Thanh toán bằng Pi Testnet</h1>
      <button
        onClick={handlePay}
        disabled={loading}
        className="bg-orange-600 text-white px-6 py-3 rounded-lg"
      >
        {loading ? "Đang xử lý..." : "Pay Now"}
      </button>
    </main>
  );
}
