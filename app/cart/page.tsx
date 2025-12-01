"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useCart } from "../context/CartContext";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import "@/app/lib/i18n"; 

declare global {
  interface Window {
    Pi?: {
      createPayment: (
        options: Record<string, unknown>,
        callbacks: Record<string, (paymentId: string, txid?: string) => Promise<void> | void>
      ) => Promise<unknown>;
    };
  }
}

export default function CartPage() {
  const { cart, removeFromCart, updateQty, clearCart } = useCart();
  const { user, piReady } = useAuth();
  const router = useRouter();

  // 🔹 Tạo translate giả lập (giữ nguyên logic dùng translate)
  const translate = (key: string): string => key;

  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const toggleSelect = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedItems.length === cart.length) setSelectedItems([]);
    else setSelectedItems(cart.map((i) => i.id));
  };

  // 🚀 Thanh toán nhiều sản phẩm
  const handlePaySelected = async () => {
    try {
      if (!piReady || !window.Pi) {
        alert("⚠️ Vui lòng mở trong Pi Browser và chờ SDK load xong!");
        return;
      }
      if (!user) {
        alert("🔑 Vui lòng đăng nhập Pi trước khi thanh toán!");
        router.push("/pilogin");
        return;
      }
      if (selectedItems.length === 0) {
        alert("⚠️ " + translate("please_select_item"));
        return;
      }

      setLoading(true);

      const selectedProducts = cart.filter((i) => selectedItems.includes(i.id));
      const total = selectedProducts.reduce(
        (sum, i) => sum + i.price * (i.quantity || 1),
        0
      );

      const orderId = Date.now();
      const accessToken =
        user?.accessToken ||
        JSON.parse(localStorage.getItem("pi_user") || "{}").accessToken;

      const verifyRes = await fetch("/api/pi/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken }),
      });
      const verifyData = await verifyRes.json();

      if (!verifyData.success) {
        alert("❌ Lỗi xác minh tài khoản. Hãy đăng nhập lại.");
        localStorage.removeItem("pi_user");
        return router.push("/pilogin");
      }

      const payment = await window.Pi.createPayment(
        {
          amount: total,
          memo: `${translate("paying_order")} (${selectedProducts.length} items)`,
          metadata: { orderId, buyer: verifyData.user.username, items: selectedProducts },
        },
        {
          onReadyForServerApproval: async (paymentId) => {
            await fetch("/api/pi/approve", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ paymentId, orderId }),
            });
          },
          onReadyForServerCompletion: async (paymentId, txid) => {
            await fetch("/api/pi/complete", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ paymentId, txid, metadata: { orderId } }),
            });
            clearCart();
            alert(`🎉 ${translate("payment_success")}`);
            router.push("/customer/pending");
          },
          onCancel: () => alert("❌ " + translate("payment_cancelled")),
          onError: (err) =>
            alert("💥 " + translate("payment_error") + ": " + (err instanceof Error ? err.message : "Error")),
        }
      );

      console.log("💰 Kết quả thanh toán:", payment);
    } catch (error) {
      console.error("❌ Thanh toán thất bại:", error);
      alert("💥 " + translate("payment_failed"));
    } finally {
      setLoading(false);
    }
  };

  const total = cart
    .filter((i) => selectedItems.includes(i.id))
    .reduce((sum, i) => sum + i.price * (i.quantity || 1), 0);

  return (
    <main className="min-h-screen bg-gray-50 p-4 flex flex-col items-center">
      {/* giữ nguyên UI */}
      {/* ... */}
    </main>
  );
}
