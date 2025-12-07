"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "../context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft } from "lucide-react";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";

declare global {
  interface Window {
    Pi?: any;
  }
}

export default function CheckoutPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { cart, total, clearCart } = useCart();
  const { user, piReady } = useAuth();

  const [shipping, setShipping] = useState(null);
  const [loading, setLoading] = useState(false);

  // INIT PI SDK (TESTNET)
  useEffect(() => {
    if (window.Pi) {
      window.Pi.init({
        version: "2.0",
        sandbox: true,
      });
    }
  }, []);

  // Load shipping info
  useEffect(() => {
    const saved = localStorage.getItem("shipping_info");
    if (saved) setShipping(JSON.parse(saved));
  }, []);

  const handlePayWithPi = async () => {
    if (!user) return router.push("/pilogin");
    if (!piReady || !window.Pi) return alert(t.pi_not_ready);
    if (!shipping) return router.push("/customer/address");
    if (cart.length === 0) return alert(t.cart_empty);

    setLoading(true);

    const orderId = `ORD-${Date.now()}`;

    //------------------------------------------------
    // 1️⃣ Gửi API CREATE PAYMENT (bắt buộc!)
    //------------------------------------------------
    const createRes = await fetch("/api/pi/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        amount: total.toFixed(2),
        orderId,
        shipping,
        items: cart,
      }),
    });

    const createData = await createRes.json();

    if (!createData.success) {
      alert("Lỗi tạo giao dịch!");
      setLoading(false);
      return;
    }

    //------------------------------------------------
    // 2️⃣ BẮT ĐẦU THANH TOÁN TRÊN PI SDK
    //------------------------------------------------
    try {
      await window.Pi.createPayment(
        {
          amount: total.toFixed(2),
          memo: `Payment for order ${orderId}`,
          metadata: { orderId, buyer: user.username, items: cart, shipping },
        },
        {
          onReadyForServerApproval: async (paymentId) => {
            await fetch("/api/pi/approve", {
              method: "POST",
              credentials: "include",
              body: JSON.stringify({ paymentId }),
            });
          },

          onReadyForServerCompletion: async (paymentId, txid) => {
            await fetch("/api/pi/complete", {
              method: "POST",
              credentials: "include",
              body: JSON.stringify({ paymentId, txid }),
            });

            clearCart();
            alert(t.payment_success);
            router.push("/customer/pending");
          },

          onCancel: () => alert(t.payment_canceled),

          onError: (err) => alert("Lỗi: " + err.message),
        }
      );
    } catch (err) {
      alert(t.transaction_failed);
    }

    setLoading(false);
  };

  // UI render...
}
