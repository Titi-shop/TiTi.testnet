"use client";

import { useEffect, useState } from "react";
import { useCart } from "../context/CartContext";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft } from "lucide-react";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";

/* =========================
   🔧 FIX ESLINT: REMOVE any
========================= */
interface PiPaymentData {
  amount: number;
  memo?: string;
  metadata?: Record<string, unknown>;
}

interface PiPaymentCallbacks {
  onReadyForServerApproval?: (paymentId: string) => Promise<void>;
  onReadyForServerCompletion?: (
    paymentId: string,
    txid: string
  ) => Promise<void>;
  onCancel?: () => void;
  onError?: (error: unknown) => void;
}

declare global {
  interface Window {
    Pi?: {
      createPayment: (
        data: PiPaymentData,
        callbacks: PiPaymentCallbacks
      ) => Promise<void>;
    };
  }
}

/* =========================
   TYPES
========================= */
interface ShippingInfo {
  name: string;
  phone: string;
  address: string;
  country?: string;
}

interface CartItem {
  id?: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  images?: string[];
}

/* =========================
   PAGE
========================= */
export default function CheckoutPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { cart, clearCart, total } = useCart();
  const { user, piReady } = useAuth();

  const [loading, setLoading] = useState(false);
  const [shipping, setShipping] = useState<ShippingInfo | null>(null);

  /* =====================
     LOAD SHIPPING INFO
  ===================== */
  useEffect(() => {
    try {
      const saved = localStorage.getItem("shipping_info");
      if (saved) setShipping(JSON.parse(saved));
    } catch (err) {
      console.warn("⚠️ Lỗi đọc shipping_info:", err);
    }
  }, []);

  /* =====================
     PI PAYMENT
  ===================== */
  const handlePayWithPi = async () => {
    if (!piReady || !window.Pi) {
      alert(t.pi_not_ready || "Pi chưa sẵn sàng");
      return;
    }

    if (!user?.username) {
      alert(t.must_login_before_pay || "Vui lòng đăng nhập");
      router.push("/pilogin");
      return;
    }

    if (cart.length === 0) {
      alert(t.cart_empty || "Giỏ hàng trống");
      return;
    }

    if (!shipping?.name || !shipping?.phone || !shipping?.address) {
      alert(t.must_fill_shipping || "Vui lòng nhập địa chỉ");
      router.push("/customer/address");
      return;
    }

    setLoading(true);

    try {
      const orderId = `ORD-${Date.now()}`;

      const verifyRes = await fetch("/api/pi/verify", {
        method: "GET",
        credentials: "include",
      });

      const verifyData = await verifyRes.json();

      if (!verifyData?.success || !verifyData?.user) {
        alert(t.must_login_before_pay || "Vui lòng đăng nhập");
        router.push("/pilogin");
        return;
      }

      const paymentData: PiPaymentData = {
        amount: Number(total.toFixed(2)),
        memo: `${t.payment_for_order || "Thanh toán đơn"} #${orderId}`,
        metadata: {
          orderId,
          buyer: verifyData.user.username,
          items: cart,
          shipping,
        },
      };

      const callbacks: PiPaymentCallbacks = {
        onReadyForServerApproval: async (paymentId: string) => {
          await fetch("/api/pi/approve", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentId, orderId }),
          });
        },

        onReadyForServerCompletion: async (
          paymentId: string,
          txid: string
        ) => {
          await fetch("/api/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: orderId,
              buyer: verifyData.user.username,
              items: cart,
              total,
              txid,
              shipping,
              status: t.paid || "paid",
              createdAt: new Date().toISOString(),
            }),
          });

          await fetch("/api/pi/complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentId, txid }),
          });

          clearCart();
          alert(t.payment_success || "Thanh toán thành công");
          router.push("/customer/pending");
        },

        onCancel: () => {
          alert(t.payment_canceled || "Đã hủy thanh toán");
        },

        onError: (error: unknown) => {
          console.error("💥 Pi error:", error);
          alert(
            (t.payment_error || "Lỗi thanh toán: ") +
              (error instanceof Error ? error.message : "")
          );
        },
      };

      await window.Pi.createPayment(paymentData, callbacks);
    } catch (err) {
      console.error("❌ Thanh toán lỗi:", err);
      alert(t.transaction_failed || "Giao dịch thất bại");
    } finally {
      setLoading(false);
    }
  };

  /* =====================
     IMAGE FALLBACK
  ===================== */
  const resolveImageUrl = (img?: string) => {
    if (!img) return "/placeholder.png";
    if (img.startsWith("http")) return img;
    return "/" + img.replace(/^\//, "");
  };

  return (
    <main className="max-w-md mx-auto min-h-screen bg-gray-50 flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-3 border-b sticky top-0 z-10">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-700 hover:text-blue-600"
        >
          <ArrowLeft className="w-5 h-5 mr-1" />
          <span>{t.back || "Quay lại"}</span>
        </button>
        <h1 className="font-semibold text-gray-800">
          {t.checkout || "Thanh toán"}
        </h1>
        <div className="w-5" />
      </div>

      {/* UI phần còn lại giữ nguyên */}
    </main>
  );
}
