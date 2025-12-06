"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useCart } from "../context/CartContext";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";

interface PiSDK {
  createPayment: (
    data: {
      amount: number;
      memo: string;
      metadata: Record<string, unknown>;
    },
    callbacks: {
      onReadyForServerApproval: (paymentId: string) => void;
      onReadyForServerCompletion: (paymentId: string, txid: string) => void;
      onCancel: () => void;
      onError: (err: Error) => void;
    }
  ) => Promise<void>;
}

declare global {
  interface Window {
    Pi?: PiSDK;
  }
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  images?: string[];
}

export default function CartPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { cart, removeFromCart, updateQty, clearCart } = useCart();
  const { user, piReady } = useAuth();

  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // chọn / bỏ chọn
  const toggleSelect = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedItems(
      selectedItems.length === cart.length ? [] : cart.map((i) => i.id)
    );
  };

  // ================================
  // 🔥 THANH TOÁN
  // ================================
  const handlePaySelected = async () => {
    if (!piReady || !window.Pi) {
      alert(t.pi_not_ready);
      return;
    }

    if (!user) {
      alert(t.must_login_first);
      router.push("/pilogin");
      return;
    }

    if (selectedItems.length === 0) {
      alert(t.please_select_item);
      return;
    }

    const selectedProducts = cart.filter((p) =>
      selectedItems.includes(p.id)
    );

    const total = selectedProducts.reduce(
      (s, p) => s + p.price * p.quantity,
      0
    );

    const orderId = `ORD-${Date.now()}`;

    setLoading(true);

    try {
      await window.Pi!.createPayment(
        {
          amount: total,
          memo: `${t.paying_order} (${selectedProducts.length} items)`,
          metadata: {
            orderId,
            buyer: user.username, // 🔥 LẤY TỪ AuthContext (đúng chuẩn)
            items: selectedProducts,
          },
        },
        {
          async onReadyForServerApproval(paymentId: string) {
            await fetch("/api/pi/approve", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ paymentId, orderId }),
            });
          },

          async onReadyForServerCompletion(paymentId: string, txid: string) {
            await fetch("/api/pi/complete", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ paymentId, txid }),
            });

            clearCart();
            alert(t.payment_success);
            router.push("/customer/pending");
          },

          onCancel() {
            alert(t.payment_cancelled);
          },

          onError(err: Error) {
            alert(t.payment_error + ": " + err.message);
          },
        }
      );
    } catch {
      alert(t.payment_failed);
    } finally {
      setLoading(false);
    }
  };

  const totalSelected = cart
    .filter((i) => selectedItems.includes(i.id))
    .reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <main className="min-h-screen bg-gray-50 p-4 flex flex-col items-center">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow p-4">
        <h1 className="text-xl font-bold mb-4 text-center text-[#ff6600]">
          🛒 {t.cart_title}
        </h1>

        {/* UI giữ nguyên như của bạn */}
        {/* ... */}
      </div>
    </main>
  );
}
