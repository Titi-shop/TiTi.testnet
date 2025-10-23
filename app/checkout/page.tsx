"use client";

import { useEffect, useState } from "react";
import { useCart } from "../context/CartContext";
import { useRouter } from "next/navigation";

declare global {
  interface Window {
    Pi?: any;
  }
}

export default function CheckoutPage() {
  const { cart, clearCart, total } = useCart();
  const router = useRouter();
  const [wallet, setWallet] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState("guest");
  const [shipping, setShipping] = useState<any>(null);

  // ✅ Lấy thông tin đăng nhập
  useEffect(() => {
    try {
      const username = localStorage.getItem("titi_username");
      if (username) setUser(username);
    } catch {}
  }, []);

  // ✅ Lấy ví Pi (mock)
  useEffect(() => {
    const w = Number(localStorage.getItem("pi_wallet") ?? "1000");
    setWallet(w);
  }, []);

  // ✅ Lấy địa chỉ giao hàng đã lưu
  useEffect(() => {
    const saved = localStorage.getItem("shipping_info");
    if (saved) setShipping(JSON.parse(saved));
  }, []);

  // 💰 Thanh toán qua Pi
  const handlePay = async () => {
    if (!window.Pi) {
      alert("⚠️ Hãy mở trong Pi Browser để thanh toán!");
      return;
    }
    if (!shipping) {
      alert("📦 Vui lòng chọn địa chỉ giao hàng!");
      router.push("/customer/address");
      return;
    }
    if (cart.length === 0) {
      alert("🛒 Giỏ hàng trống!");
      return;
    }

    setLoading(true);

    try {
      window.Pi.init({ version: "2.0", sandbox: false });
      const scopes = ["payments", "username", "wallet_address"];
      const auth = await window.Pi.authenticate(scopes, (res: any) => res);

      const orderId = Date.now();
      const paymentData = {
        amount: total,
        memo: `Thanh toán đơn hàng #${orderId}`,
        metadata: {
          orderId,
          items: cart,
          buyer: auth.user?.username || user,
        },
      };

      const callbacks = {
        onReadyForServerApproval: async (paymentId: string) => {
          await fetch("/api/pi/approve", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentId }),
          });
        },
        onReadyForServerCompletion: async (paymentId: string, txid: string) => {
          const res = await fetch("/api/pi/complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentId, txid }),
          });
          const result = await res.json();

          if (result?.success) {
            const order = {
              id: orderId,
              items: cart,
              total,
              buyer: auth.user?.username || user,
              status: "Đã thanh toán",
              note: `Pi TXID: ${txid}`,
              createdAt: new Date().toISOString(),
              shipping,
            };

            await fetch("/api/orders", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(order),
            });

            clearCart();
            alert("✅ Thanh toán thành công!");
            router.push("/customer/pending");
          } else {
            alert("⚠️ Giao dịch đang chờ xác minh.");
          }
        },
        onCancel: () => alert("❌ Giao dịch bị huỷ."),
        onError: (error: any) => {
          console.error("💥 Lỗi:", error);
          alert("💥 Lỗi trong quá trình thanh toán: " + error.message);
        },
      };

      await window.Pi.createPayment(paymentData, callbacks);
    } catch (err: any) {
      console.error("❌ Lỗi thanh toán:", err);
      alert("❌ Giao dịch thất bại hoặc bị huỷ.");
    } finally {
      setLoading(false);
    }
  };

  // 🧱 Giao diện
  return (
    <main className="max-w-md mx-auto min-h-screen bg-gray-50 flex flex-col justify-between">
      <div>
        {/* Địa chỉ giao hàng */}
        <div
          className="bg-white border-b border-gray-200 p-4 flex justify-between items-center cursor-pointer"
          onClick={() => router.push("/customer/address")}
        >
          {shipping ? (
            <div className="flex-1">
              <p className="font-semibold text-gray-800">{shipping.name}</p>
              <p className="text-gray-600 text-sm">{shipping.phone}</p>
              <p className="text-gray-500 text-sm">
                {shipping.country}, {shipping.address}
              </p>
            </div>
          ) : (
            <p className="text-gray-500">➕ Thêm địa chỉ giao hàng</p>
          )}
          <span className="text-blue-500 text-sm ml-3">Chỉnh sửa ➜</span>
        </div>

        {/* Danh sách sản phẩm */}
        <div className="p-4 bg-white mt-2 border-t">
          <h2 className="font-semibold text-gray-800 mb-2">🛒 Giỏ hàng</h2>
          {cart.length === 0 ? (
            <p className="text-gray-500 text-sm">Không có sản phẩm nào.</p>
          ) : (
            <div className="space-y-3">
              {cart.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center border-b border-gray-100 pb-2 cursor-pointer hover:bg-gray-50 rounded"
                  onClick={() => router.push(`/product/${item.id}`)}
                >
                  <img
                    src={item.image || "/placeholder.png"}
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div className="ml-3 flex-1">
                    <p className="text-gray-800 font-medium text-sm">
                      {item.name}
                    </p>
                    <p className="text-gray-500 text-xs">
                      x{item.quantity} × {item.price} Pi
                    </p>
                  </div>
                  <p className="text-orange-600 font-semibold text-sm">
                    {(item.price * item.quantity).toFixed(2)} Pi
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tổng cộng + nút Pay */}
      <div className="bg-white border-t border-gray-200 p-4 flex justify-between items-center">
        <div>
          <p className="text-gray-600 text-sm">Tổng cộng:</p>
          <p className="text-xl font-bold text-orange-600">{total.toFixed(2)} Pi</p>
        </div>
        <button
          onClick={handlePay}
          disabled={loading}
          className={`px-6 py-3 rounded-lg font-semibold text-white text-sm ${
            loading
              ? "bg-gray-400"
              : "bg-orange-600 hover:bg-orange-700 active:bg-orange-800"
          }`}
        >
          {loading ? "Đang xử lý..." : "Pay Now"}
        </button>
      </div>
    </main>
  );
}
