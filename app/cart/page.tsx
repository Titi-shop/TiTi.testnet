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
  const { cart, removeFromCart, updateQty, clearCart } = useCart();
  const { user, piReady } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();

  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // chọn item
  const toggleSelect = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // chọn tất cả
  const selectAll = () => {
    if (selectedItems.length === cart.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(cart.map((i) => i.id));
    }
  };

  // -------------------------------
  // 🔥 THANH TOÁN SẢN PHẨM ĐƯỢC CHỌN
  // -------------------------------
  const handlePaySelected = async () => {
    if (!piReady || !window.Pi) {
      alert("⚠️ " + t.pi_not_ready);
      return;
    }

    if (!user) {
      alert("🔑 " + t.must_login_first);
      router.push("/pilogin");
      return;
    }

    if (selectedItems.length === 0) {
      alert("⚠️ " + t.please_select_item);
      return;
    }

    const selectedProducts = cart.filter((i) => selectedItems.includes(i.id));
    const total = selectedProducts.reduce(
      (sum, i) => sum + i.price * (i.quantity || 1),
      0
    );

    setLoading(true);

    try {
      // ❗ BỎ accessToken trong localStorage — AuthContext đã xử lý session cookie
      const orderId = `ORD-${Date.now()}`;

      // xác minh phiên từ server (dùng cookie)
      const verifyRes = await fetch("/api/pi/verify", {
        method: "GET",
        credentials: "include",
      });

      const verifyData: {
        success: boolean;
        user?: { username: string };
      } = await verifyRes.json();

      if (!verifyData.success || !verifyData.user) {
        alert("❌ " + t.verify_failed);
        return router.push("/pilogin");
      }

      await window.Pi!.createPayment(
        {
          amount: total,
          memo: `${t.paying_order} (${selectedProducts.length} items)`,
          metadata: {
            orderId,
            buyer: verifyData.user.username,
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
            alert("🎉 " + t.payment_success);
            router.push("/customer/pending");
          },

          onCancel() {
            alert("❌ " + t.payment_cancelled);
          },

          onError(err: Error) {
            alert("💥 " + t.payment_error + ": " + err.message);
          },
        }
      );
    } catch {
      alert("💥 " + t.payment_failed);
    } finally {
      setLoading(false);
    }
  };

  const totalSelected = cart
    .filter((i) => selectedItems.includes(i.id))
    .reduce((sum, i) => sum + i.price * (i.quantity || 1), 0);

  return (
    <main className="min-h-screen bg-gray-50 p-4 flex flex-col items-center">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow p-4">
        <h1 className="text-xl font-bold mb-4 text-center text-[#ff6600]">
          🛒 {t.cart_title}
        </h1>

        {cart.length === 0 ? (
          <div className="text-center py-10">
            <p className="mb-2 text-gray-600">{t.empty_cart}</p>
            <Link href="/" className="text-[#ff6600] hover:underline font-medium">
              {t.back_to_shop}
            </Link>
          </div>
        ) : (
          <>
            <div className="divide-y">
              {cart.map((it: CartItem) => (
                <div key={it.id} className="flex items-center py-4 gap-3">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(it.id)}
                    onChange={() => toggleSelect(it.id)}
                    className="w-5 h-5 accent-[#ff6600]"
                  />

                  <div className="w-20 h-20 bg-gray-100 rounded overflow-hidden">
                    {it.images?.[0] ? (
                      <img
                        src={it.images[0]}
                        alt={it.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                        {t.no_image}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800">{it.name}</h3>
                    <p className="font-bold text-[#ff6600]">{it.price} π</p>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center border rounded overflow-hidden">
                      <button
                        onClick={() => updateQty(it.id, Math.max(1, it.quantity - 1))}
                        className="px-2 py-1 text-gray-600 hover:text-[#ff6600]"
                      >
                        −
                      </button>

                      <input
                        type="number"
                        min={1}
                        value={it.quantity}
                        onChange={(e) =>
                          updateQty(it.id, Math.max(1, Number(e.target.value)))
                        }
                        className="w-10 text-center outline-none border-x border-gray-200"
                      />

                      <button
                        onClick={() => updateQty(it.id, it.quantity + 1)}
                        className="px-2 py-1 text-gray-600 hover:text-[#ff6600]"
                      >
                        ＋
                      </button>
                    </div>

                    <button
                      onClick={() => removeFromCart(it.id)}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      {t.delete}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 border-t pt-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedItems.length === cart.length}
                  onChange={selectAll}
                  className="w-5 h-5 accent-[#ff6600]"
                />
                <span
                  onClick={selectAll}
                  className="text-gray-700 text-sm cursor-pointer select-none"
                >
                  {selectedItems.length === cart.length
                    ? t.unselect_all
                    : t.select_all}
                </span>
              </div>

              <div className="text-right">
                <p className="text-sm">
                  {t.total}:{" "}
                  <span className="font-bold text-[#ff6600]">
                    {totalSelected.toFixed(2)} π
                  </span>
                </p>

                <button
                  onClick={handlePaySelected}
                  disabled={selectedItems.length === 0 || loading}
                  className={`mt-2 px-5 py-2 rounded-lg font-semibold text-white ${
                    selectedItems.length === 0 || loading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-[#ff6600] hover:bg-[#e65500]"
                  }`}
                >
                   {loading ? t.processing : t.order_now}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
