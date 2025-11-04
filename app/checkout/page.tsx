"use client";
import { useEffect, useState } from "react";
import { useCart } from "../context/CartContext";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

declare global {
  interface Window { Pi?: any; }
}

export default function CheckoutPage() {
  const { cart, clearCart, total } = useCart();
  const { user, piReady } = useAuth();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [shippingInfo, setShippingInfo] = useState({
    name: "", phone: "", address: "",
  });

  useEffect(() => {
    const saved = localStorage.getItem("shipping_info");
    if (saved) setShippingInfo(JSON.parse(saved));
  }, []);

  const handleShippingChange = (e: any) => {
    const updated = { ...shippingInfo, [e.target.name]: e.target.value };
    setShippingInfo(updated);
    localStorage.setItem("shipping_info", JSON.stringify(updated));
  };

  const handlePayWithPi = async () => {
    if (!piReady || !window.Pi) {
      alert("⚠️ Pi SDK chưa sẵn sàng. Hãy mở trong Pi Browser.");
      return;
    }
    if (!user?.username) {
      alert("🔑 Vui lòng đăng nhập Pi trước khi thanh toán!");
      router.push("/pilogin");
      return;
    }
    if (cart.length === 0) {
      alert("🛒 Giỏ hàng trống.");
      return;
    }
    if (!shippingInfo.name || !shippingInfo.phone || !shippingInfo.address) {
      alert("📦 Vui lòng nhập đầy đủ địa chỉ giao hàng.");
      return;
    }

    setLoading(true);
    try {
      const orderId = `ORD-${Date.now()}`;

      const paymentData = {
        amount: Number(total.toFixed(2)),
        memo: `Thanh toán đơn hàng #${orderId}`,
        metadata: {
          orderId,
          buyer: user.username,
          items: cart,
          shipping: shippingInfo,
        },
      };

      const callbacks = {
        onReadyForServerApproval: async (paymentId: string) => {
          console.log("⏳ onReadyForServerApproval:", paymentId);
          await fetch("/api/pi/approve", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentId }),
          });
        },

        onReadyForServerCompletion: async (paymentId: string, txid: string) => {
          console.log("✅ onReadyForServerCompletion:", paymentId, txid);

          // Lưu đơn
          await fetch("/api/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: orderId,
              buyer: user.username,
              items: cart,
              total,
              txid,
              shipping: shippingInfo,
              status: "Đã thanh toán",
              createdAt: new Date().toISOString(),
            }),
          });

          // Complete giao dịch trên Pi
          await fetch("/api/pi/complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentId, txid }),
          });

          clearCart();
          alert("🎉 Thanh toán thành công!");
          router.push("/customer/pending");
        },

        onCancel: async (paymentId: string) => {
          console.log("🛑 onCancel:", paymentId);
          alert("❌ Giao dịch đã huỷ.");
        },

        onError: (error: any) => {
          console.error("💥 onError:", error);
          alert("💥 Lỗi thanh toán: " + error.message);
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

  return (
    <main className="max-w-3xl mx-auto p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-4 text-center text-orange-600">💳 Thanh toán</h1>

      <div className="p-4 border rounded-lg bg-white mb-4">
        <h3 className="font-semibold text-blue-600 mb-2">📦 Thông tin giao hàng</h3>
        <label className="block mb-2">
          Họ và tên:
          <input name="name" value={shippingInfo.name} onChange={handleShippingChange} className="w-full border p-2 rounded" />
        </label>
        <label className="block mb-2">
          Số điện thoại:
          <input name="phone" value={shippingInfo.phone} onChange={handleShippingChange} className="w-full border p-2 rounded" />
        </label>
        <label className="block mb-2">
          Địa chỉ giao hàng:
          <textarea name="address" value={shippingInfo.address} onChange={handleShippingChange} className="w-full border p-2 rounded" />
        </label>
      </div>

      <div className="bg-white p-4 rounded shadow mb-4">
        <p>Người mua: <b>{user?.username || "guest"}</b></p>
        <p>Tổng đơn hàng: <b className="text-yellow-600">{total} Pi</b></p>
      </div>

      <button
        onClick={handlePayWithPi}
        disabled={loading}
        className={`w-full py-3 rounded text-white font-semibold ${loading ? "bg-gray-400" : "bg-purple-600 hover:bg-purple-700"}`}
      >
        {loading ? "Đang mở Pi Wallet..." : "Thanh toán bằng Pi Wallet (Testnet)"}
      </button>
    </main>
  );
}
