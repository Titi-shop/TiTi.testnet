"use client";

import React from "react";
import Link from "next/link";
import { useCart } from "../context/CartContext";
import { useRouter } from "next/navigation";
import { useLanguage } from "../context/LanguageContext";

export default function CartPage() {
  const { cart, removeFromCart, updateQty, clearCart } = useCart();
  const router = useRouter();
  const { translate } = useLanguage();

  const handlePayOne = async (item: any) => {
    try {
      if (!window.Pi) {
        alert("⚠️ " + translate("please_open_in_pi_browser"));
        return;
      }

      const userInfo = JSON.parse(localStorage.getItem("user_info") || "{}");
      const buyer = userInfo.username || "guest_user";
      const orderId = Date.now();

      const scopes = ["payments", "username", "wallet_address"];
      const auth = await window.Pi.authenticate(scopes, (res) => res);

      const payment = await window.Pi.createPayment(
        {
          amount: item.price * (item.quantity || 1),
          memo: `${translate("paying_product")} ${item.name}`,
          metadata: { orderId, buyer, item },
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
          },
          onCancel: () => alert("❌ " + translate("payment_cancelled")),
          onError: (err) => console.error("💥 " + translate("payment_error"), err),
        }
      );

      const orderData = {
        id: orderId,
        buyer,
        total: item.price * (item.quantity || 1),
        items: [item],
        createdAt: new Date().toISOString(),
        status: translate("waiting_confirm"),
      };

      await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      removeFromCart(item.id);
      alert(`🎉 ${translate("payment_success")}: ${item.name}`);
      router.push("/customer/pending");
    } catch (error) {
      console.error("❌ " + translate("payment_error"), error);
      alert("💥 " + translate("payment_failed"));
    }
  };

  const total = cart.reduce((sum, i) => sum + i.price * (i.quantity || 1), 0);

  return (
    <main className="min-h-screen bg-gray-50 p-4 flex flex-col items-center">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow p-4">
        <h1 className="text-xl font-bold mb-4 text-center">🛒 {translate("cart_title")}</h1>

        {cart.length === 0 ? (
          <div className="text-center py-10">
            <p className="mb-2 text-gray-600">{translate("empty_cart")}</p>
            <Link href="/" className="text-purple-600 hover:underline font-medium">
              {translate("back_to_shop")}
            </Link>
          </div>
        ) : (
          <>
            <div className="divide-y">
              {cart.map((it) => (
                <div key={it.id} className="flex items-center py-4 gap-3">
                  <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded overflow-hidden">
                    {it.images?.[0] ? (
                      <img src={it.images[0]} alt={it.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                        {translate("no_image")}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{it.name}</h3>
                    <p className="text-yellow-600 font-bold">{it.price} π</p>
                    <p className="text-gray-500 text-sm line-clamp-2">{it.description}</p>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <input
                      type="number"
                      min={1}
                      value={it.quantity || 1}
                      onChange={(e) => updateQty(it.id, Math.max(1, Number(e.target.value)))}
                      className="w-16 border rounded text-center p-1"
                    />
                    <button
                      onClick={() => removeFromCart(it.id)}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      {translate("delete")}
                    </button>
                    <button
                      onClick={() => handlePayOne(it)}
                      className="bg-purple-600 text-white text-sm px-3 py-1 rounded hover:bg-purple-700"
                    >
                      💳 {translate("pay_with_pi")}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 border-t pt-4 flex justify-between items-center text-sm">
              <button
                onClick={() => {
                  clearCart();
                  alert("🗑️ " + translate("cart_cleared"));
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                {translate("clear_all")}
              </button>

              <div className="text-right">
                <p className="font-semibold">
                  {translate("total")}: <span className="text-purple-600">{total.toFixed(2)} π</span>
                </p>
                <button
                  onClick={() => alert("🚀 Tính năng thanh toán toàn bộ đang phát triển")}
                  className="mt-2 bg-orange-500 text-white px-5 py-2 rounded-lg font-semibold hover:bg-orange-600"
                >
                  {translate("order_now")}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
