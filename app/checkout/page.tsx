"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "../context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft } from "lucide-react";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";

interface ShippingInfo {
  name: string;
  phone: string;
  address: string;
  country?: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { cart, total, clearCart } = useCart();
  const { user, piReady } = useAuth();

  const [shipping, setShipping] = useState<ShippingInfo | null>(null);
  const [loading, setLoading] = useState(false);

  // Load shipping
  useEffect(() => {
    const saved = localStorage.getItem("shipping_info");
    if (saved) setShipping(JSON.parse(saved));
  }, []);

  // ===============================
  // HANDLE PAYMENT
  // ===============================
  const handlePayWithPi = async () => {
    if (!user) {
      alert(t.must_login_before_pay);
      return router.push("/pilogin");
    }

    if (!piReady || !window.Pi) {
      return alert("Pi SDK chưa sẵn sàng — hãy reload lại trang!");
    }

    if (!shipping) {
      alert(t.must_fill_shipping);
      return router.push("/customer/address");
    }

    if (cart.length === 0) return alert(t.cart_empty);

    setLoading(true);

    const orderId = `ORD-${Date.now()}`;

    // 1️⃣ Tạo giao dịch với backend
    const createRes = await fetch("/api/pi/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        amount: Number(total.toFixed(2)),
        orderId,
        items: cart,
        shipping,
        buyer: user.username,
      }),
    });

    const createData = await createRes.json();
    if (!createData.success) {
      alert("Không thể tạo giao dịch.");
      setLoading(false);
      return;
    }

    const backendPaymentId = createData.paymentId;

    // 2️⃣ Payment data đúng chuẩn
    const paymentData = {
      amount: Number(total.toFixed(2)),
      memo: `Payment for order ${orderId}`,
      metadata: {
        orderId,
        buyer: user.username,
        backendPaymentId, // ⭐ BẮT BUỘC
      },
    };

    // 3️⃣ Callbacks chuẩn
    const callbacks = {
      onReadyForServerApproval: async (piPaymentId: string) => {
        await fetch("/api/pi/approve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            piPaymentId,        // dùng ID thật từ ví
            backendPaymentId,   // dùng để map server
          }),
        });
      },

      onReadyForServerCompletion: async (piPaymentId: string, txid: string) => {
        await fetch("/api/pi/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            piPaymentId,
            backendPaymentId,
            txid,
          }),
        });

        // Lưu order
        await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            id: orderId,
            buyer: user.username,
            items: cart,
            total,
            txid,
            shipping,
            createdAt: new Date().toISOString(),
          }),
        });

        clearCart();
        alert(t.payment_success);
        router.push("/customer/pending");
      },

      onCancel: () => alert(t.payment_canceled),
      onError: (err: Error) => alert("Lỗi thanh toán: " + err.message),
    };

    // 4️⃣ Gọi ví
    try {
      await window.Pi!.createPayment(paymentData, callbacks);
    } catch (e) {
      alert("Giao dịch thất bại hoặc bị hủy.");
    }

    setLoading(false);
  };

  return (
    <main className="max-w-md mx-auto">
      {/* UI giữ nguyên */}
    </main>
  );
}
