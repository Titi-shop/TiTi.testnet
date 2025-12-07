"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "../context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft } from "lucide-react";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";

export default function CheckoutPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { cart, total, clearCart } = useCart();
  const { user, piReady } = useAuth();

  const [shipping, setShipping] = useState(null);
  const [loading, setLoading] = useState(false);

  // ⚠ BẮT BUỘC — BẬT TESTNET
  useEffect(() => {
    if (window.Pi) {
      window.Pi.init({
        version: "2.0",
        sandbox: true,
      });
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("shipping_info");
    if (saved) setShipping(JSON.parse(saved));
  }, []);

  const handlePayWithPi = async () => {
    if (!user) return router.push("/pilogin");
    if (!piReady || !window.Pi) return alert("Pi SDK chưa sẵn sàng");
    if (!shipping) return alert("Chưa có địa chỉ giao hàng");
    if (cart.length === 0) return alert("Giỏ hàng trống");

    setLoading(true);

    const orderId = `ORD-${Date.now()}`;

    const paymentData = {
      amount: Number(total.toFixed(2)),
      memo: `Order ${orderId}`,
      metadata: {
        orderId,
        buyer: user.username,
        items: cart,
        shipping,
      },
    };

    const callbacks = {
      // ⚠ CREATE PAYMENT BẮT BUỘC
      onReadyForServerApproval: async (paymentId) => {
        console.log("🔥 APPROVAL CALLBACK:", paymentId);

        // LƯU GIÁO DỊCH TRƯỚC
        await fetch("/api/pi/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            paymentId,
            amount: paymentData.amount,
            orderId,
            items: cart,
            buyer: user.username,
            shipping,
          }),
        });

        // SAU ĐÓ APPROVE
        await fetch("/api/pi/approve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ paymentId }),
        });
      },

      onReadyForServerCompletion: async (paymentId, txid) => {
        console.log("🔥 COMPLETE CALLBACK:", paymentId, txid);

        await fetch("/api/pi/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ paymentId, txid }),
        });

        clearCart();
        alert("Thanh toán thành công!");
        router.push("/customer/pending");
      },

      onCancel: () => alert("Bạn đã hủy thanh toán"),
      onError: (err) => {
        console.error(err);
        alert("Lỗi thanh toán:" + err.message);
      },
    };

    try {
      await window.Pi.createPayment(paymentData, callbacks);
    } catch (err) {
      console.error("SDK ERROR:", err);
      alert("Không tạo được giao dịch");
    }

    setLoading(false);
  };

  return (
    <main className="max-w-md mx-auto">
      <button onClick={handlePayWithPi}>
        Thanh toán ngay
      </button>
    </main>
  );
}
