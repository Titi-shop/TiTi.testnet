"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "./context/AuthContext"; // ✅ Thêm để kiểm tra đăng nhập

export default function CartPage() {
  const { cart, removeFromCart, updateQty } = useCart();
  const { translate } = useLanguage();
  const { user, piReady } = useAuth(); // ✅ Nhận thông tin login và SDK từ AuthContext
  const router = useRouter();

  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // ✅ Chọn hoặc bỏ chọn từng sản phẩm
  const toggleSelect = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // ✅ Chọn / Bỏ chọn tất cả
  const selectAll = () => {
    if (selectedItems.length === cart.length) setSelectedItems([]);
    else setSelectedItems(cart.map((i) => i.id));
  };

  // ✅ Thanh toán các sản phẩm đã chọn
  const handlePaySelected = async () => {
    try {
      // 🧩 Kiểm tra đăng nhập
      if (!user) {
        alert("⚠️ Bạn cần đăng nhập bằng Pi để thanh toán.");
        return router.push("/pilogin");
      }

      // 🧩 Kiểm tra Pi SDK sẵn sàng
      if (!piReady || typeof window === "undefined" || !window.Pi) {
        alert("⚠️ Vui lòng mở trong Pi Browser và chờ SDK tải xong!");
        return;
      }

      if (selectedItems.length === 0) {
        alert("⚠️ " + translate("please_select_item"));
        return;
      }

      const selectedProducts = cart.filter((i) => selectedItems.includes(i.id));
      const total = selectedProducts.reduce(
        (sum, i) => sum + i.price * (i.quantity || 1),
        0
      );

      const buyer = user.username;
      const orderId = Date.now();

      // ✅ Xác thực người dùng (Pi SDK)
      const scopes = ["payments", "username", "wallet_address"];
      const auth = await window.Pi.authenticate(scopes, (payment: any) =>
        console.log("⚠️ Payment chưa hoàn tất:", payment)
      );
      console.log("✅ Pi Auth:", auth);

      // ✅ Gọi thanh toán thật qua Pi Network
      const payment = await window.Pi.createPayment(
        {
          amount: total,
          memo: `${translate("paying_order")} (${selectedProducts.length} items)`,
          metadata: { orderId, buyer, items: selectedProducts },
        },
        {
          onReadyForServerApproval: async (paymentId: string) => {
            await fetch("/api/pi/approve", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ paymentId, orderId }),
            });
          },
          onReadyForServerCompletion: async (paymentId: string, txid: string) => {
            await fetch("/api/pi/complete", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ paymentId, txid, metadata: { orderId } }),
            });
          },
          onCancel: () => alert("❌ " + translate("payment_cancelled")),
          onError: (err: any) => console.error("💥 " + translate("payment_error"), err),
        }
      );

      console.log("💰 Kết quả thanh toán:", payment);

      // ✅ Lưu đơn hàng vào backend
      const orderData = {
        id: orderId,
        buyer,
        total,
        items: selectedProducts,
        createdAt: new Date().toISOString(),
        status: translate("waiting_confirm"),
      };

      await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      // ✅ Xóa sản phẩm đã thanh toán khỏi giỏ hàng
      selectedProducts.forEach((i) => removeFromCart(i.id));

      alert(`🎉 ${translate("payment_success")}`);
      router.push("/customer/pending");
    } catch (error) {
      console.error("❌ Thanh toán thất bại:", error);
      alert("💥 " + translate("payment_failed"));
    }
  };

  // ✅ Tổng tiền
  const total = cart
    .filter((i) => selectedItems.includes(i.id))
    .reduce((sum, i) => sum + i.price * (i.quantity || 1), 0);

  // ✅ Giao diện
  return (
    <main className="min-h-screen bg-gray-50 p-4 flex flex-col items-center">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow p-4">
        <h1 className="text-xl font-bold mb-4 text-center text-[#ff6600]">
          🛒 {translate("cart_title")}
        </h1>

        {cart.length === 0 ? (
          <div className="text-center py-10">
            <p className="mb-2 text-gray-600">{translate("empty_cart")}</p>
            <Link href="/" className="text-[#ff6600] hover:underline font-medium">
              {translate("back_to_shop")}
            </Link>
          </div>
        ) : (
          <>
            <div className="divide-y">
              {cart.map((it) => (
                <div key={it.id} className="flex items-center py-4 gap-3">
                  {/* Checkbox chọn */}
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(it.id)}
                    onChange={() => toggleSelect(it.id)}
                    className="w-5 h-5 accent-[#ff6600]"
                  />

                  {/* Hình ảnh */}
                  <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded overflow-hidden">
                    {it.images?.[0] ? (
                      <img
                        src={it.images[0]}
                        alt={it.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                        {translate("no_image")}
                      </div>
                    )}
                  </div>

                  {/* Thông tin */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800">{it.name}</h3>
                    <p className="font-bold text-[#ff6600]">{it.price} π</p>
                    <p className="text-gray-500 text-sm line-clamp-2">
                      {it.description}
                    </p>
                  </div>

                  {/* Số lượng */}
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center border rounded overflow-hidden">
                      <button
                        onClick={() =>
                          updateQty(it.id, Math.max(1, (it.quantity || 1) - 1))
                        }
                        className="px-2 py-1 text-gray-600 hover:text-[#ff6600]"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min={1}
                        value={it.quantity || 1}
                        onChange={(e) =>
                          updateQty(it.id, Math.max(1, Number(e.target.value)))
                        }
                        className="w-10 text-center outline-none border-x border-gray-200"
                      />
                      <button
                        onClick={() => updateQty(it.id, (it.quantity || 1) + 1)}
                        className="px-2 py-1 text-gray-600 hover:text-[#ff6600]"
                      >
                        ＋
                      </button>
                    </div>

                    <button
                      onClick={() => removeFromCart(it.id)}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      {translate("delete")}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* ==== Footer ==== */}
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
                    ? translate("unselect_all")
                    : translate("select_all")}
                </span>
              </div>

              <div className="text-right">
                <p className="text-sm">
                  {translate("total")}:{" "}
                  <span className="font-bold text-[#ff6600]">
                    {total.toFixed(2)} π
                  </span>
                </p>

                {/* ✅ Nút thanh toán thật qua Pi */}
                <button
                  onClick={handlePaySelected}
                  disabled={selectedItems.length === 0}
                  className={`mt-2 px-5 py-2 rounded-lg font-semibold text-white ${
                    selectedItems.length === 0
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-[#ff6600] hover:bg-[#e65500]"
                  }`}
                >
                  💳 {translate("order_now")}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
