"use client";

import { useEffect, useState } from "react";
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

interface CartItem {
  name: string;
  price: number;
  quantity: number;
  image?: string;
  images?: string[];
}

export default function CheckoutPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { cart, total, clearCart } = useCart();
  const { user, piReady } = useAuth();

  const [shipping, setShipping] = useState<ShippingInfo | null>(null);
  const [loading, setLoading] = useState(false);

  // BẮT BUỘC: Kích hoạt Pi SDK TESTNET
  useEffect(() => {
    if (window.Pi) {
      window.Pi.init({
        version: "2.0",
        sandbox: true,
      });
    }
  }, []);

  // Load địa chỉ giao hàng
  useEffect(() => {
    const saved = localStorage.getItem("shipping_info");
    if (saved) setShipping(JSON.parse(saved));
  }, []);

  // ============================
  // XỬ LÝ THANH TOÁN
  // ============================
  const handlePayWithPi = async () => {
    if (!user) {
      alert(t.must_login_before_pay);
      return router.push("/pilogin");
    }

    if (!piReady || !window.Pi) {
      return alert(t.pi_not_ready);
    }

    if (!shipping) {
      alert(t.must_fill_shipping);
      return router.push("/customer/address");
    }

    if (cart.length === 0) {
      return alert(t.cart_empty);
    }

    setLoading(true);

    const orderId = `ORD-${Date.now()}`;

    // ============================
    // 1️⃣ Gọi CREATE trên server
    // ============================
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
      console.error("❌ CREATE ERROR:", createData);
      alert("Không thể tạo giao dịch Pi.");
      setLoading(false);
      return;
    }

    const backendPaymentId = createData.paymentId;

    // ============================
    // 2️⃣ Dữ liệu gửi Pi SDK  (ĐÃ SỬA)
    // ============================
    const paymentData = {
      amount: Number(total.toFixed(2)),
      memo: `Payment for order ${orderId}`,
      metadata: {
        orderId,
        buyer: user.username,

        // ⭐ BẮT BUỘC: để ví trả đúng piPaymentId
        backendPaymentId,
      },
    };

    // ============================
    // 3️⃣ CALLBACKS PI SDK (ĐÃ SỬA)
    // ============================
    const callbacks = {
      // Khi ví tạo giao dịch và chờ server approve
      onReadyForServerApproval: async (piPaymentId: string) => {
        console.log("📌 APPROVAL CALL:", { backendPaymentId, piPaymentId });

        await fetch("/api/pi/approve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            paymentId: piPaymentId, // ⭐ DÙNG PI PAYMENT ID
            backendPaymentId,       // giữ lại để server map
          }),
        });
      },

      // Khi user ký giao dịch
      onReadyForServerCompletion: async (piPaymentId: string, txid: string) => {
        console.log("📌 COMPLETION CALL:", { piPaymentId, txid });

        await fetch("/api/pi/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            paymentId: piPaymentId, // ⭐ DÙNG PI PAYMENT ID
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

      onError: (error: Error) => {
        console.error(error);
        alert(`Lỗi thanh toán: ${error.message}`);
      },
    };

    // ============================
    // 4️⃣ Gọi PI SDK (Mở ví)
    // ============================
    try {
      await window.Pi!.createPayment(paymentData, callbacks);
    } catch (e) {
      console.error(e);
      alert("Giao dịch thất bại hoặc bị hủy.");
    }

    setLoading(false);
  };

  // ============================
  // Giao diện — giữ nguyên
  // ============================
  return (
    <main className="max-w-md mx-auto min-h-screen bg-gray-50 flex flex-col justify-between">
      {/* ... giữ nguyên toàn bộ UI ... */}
    </main>
  );
}
