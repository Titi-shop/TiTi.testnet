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
    if (!user) return router.push("/pilogin");
    if (!piReady || !window.Pi) return alert(t.pi_not_ready);
    if (!shipping) return router.push("/customer/address");
    if (cart.length === 0) return alert(t.cart_empty);

    setLoading(true);

    const orderId = `ORD-${Date.now()}`;

    // 1️⃣ Gọi CREATE — tạo giao dịch nội bộ server
    const createRes = await fetch("/api/pi/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        amount: Number(total.toFixed(2)),
        orderId,
        buyer: user.username,
        items: cart,
        shipping,
      }),
    });

    const createData = await createRes.json();

    if (!createData.success) {
      alert("Không thể tạo giao dịch.");
      setLoading(false);
      return;
    }

    const backendPaymentId = createData.paymentId;

    // 2️⃣ DỮ LIỆU GỬI PI WALLET
    const paymentData = {
      amount: Number(total.toFixed(2)),
      memo: `Payment for order ${orderId}`,
      metadata: {
        orderId,
        backendPaymentId, // rất quan trọng
        buyer: user.username,
      },
    };

    // 3️⃣ CALLBACK PI SDK
    const callbacks = {
      onReadyForServerApproval: async (piPaymentId: string) => {
        console.log("📌 APPROVAL callback:", piPaymentId);

        await fetch("/api/pi/approve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            paymentId: piPaymentId, // ✔ chỉ dùng ID Pi Wallet
          }),
        });
      },

      onReadyForServerCompletion: async (piPaymentId: string, txid: string) => {
        console.log("📌 COMPLETION callback:", piPaymentId, txid);

        await fetch("/api/pi/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            paymentId: piPaymentId,
            txid,
          }),
        });

        // Lưu đơn hàng
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
        alert("Thanh toán thành công!");
        router.push("/customer/pending");
      },

      onCancel: () => alert("Bạn đã hủy giao dịch."),

      onError: (err: Error) => {
        console.error(err);
        alert(`Lỗi thanh toán: ${err.message}`);
      },
    };

    // 4️⃣ MỞ VÍ PI
    try {
      console.log("📌 Opening Pi Wallet…");
      await window.Pi.createPayment(paymentData, callbacks);
    } catch (err) {
      console.error(err);
      alert("Không thể mở ví Pi.");
    }

    setLoading(false);
  };

  return (
    <main className="max-w-md mx-auto min-h-screen bg-gray-50 flex flex-col justify-between">

      {/* HEADER */}
      <div className="flex items-center justify-between bg-white p-3 border-b">
        <button onClick={() => router.back()} className="flex items-center text-gray-700">
          <ArrowLeft className="w-5 h-5 mr-1" />
          {t.back}
        </button>
        <h1 className="font-semibold">{t.checkout}</h1>
        <div className="w-5" />
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto pb-32">
        {/* Shipping */}
        <div
          className="bg-white border-b p-4 flex justify-between"
          onClick={() => router.push("/customer/address")}
        >
          {shipping ? (
            <div>
              <p className="font-semibold">{shipping.name}</p>
              <p>{shipping.phone}</p>
              <p>{shipping.address}</p>
            </div>
          ) : (
            <p>➕ {t.add_shipping}</p>
          )}
        </div>

        {/* Cart */}
        <div className="p-4 bg-white mt-2">
          <h2 className="font-semibold mb-3">{t.products}</h2>
          {cart.map((item, i) => (
            <div key={i} className="flex items-center border-b py-2">
              <img src={item.image || item.images?.[0] || "/placeholder.png"} className="w-16 h-16 rounded" />
              <div className="ml-3 flex-1">
                <p>{item.name}</p>
                <p>x{item.quantity} × {item.price} π</p>
              </div>
              <p className="text-orange-600 font-semibold">
                {(item.price * item.quantity).toFixed(2)} π
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* FOOTER */}
      <div className="fixed bottom-16 left-0 right-0 bg-white border-t p-4 flex justify-between">
        <div>
          <p>{t.total_label}</p>
          <p className="text-xl font-bold text-orange-600">{total.toFixed(2)} π</p>
        </div>
        <button
          onClick={handlePayWithPi}
          disabled={loading}
          className="px-6 py-3 bg-orange-600 text-white rounded-lg"
        >
          {loading ? t.processing : t.pay_now}
        </button>
      </div>
    </main>
  );
}
