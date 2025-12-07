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

  // BẮT BUỘC: kích hoạt Pi SDK TESTNET
  useEffect(() => {
    if (window.Pi) {
      window.Pi.init({
        version: "2.0",
        sandbox: true,
      });
    }
  }, []);

  // Lấy địa chỉ giao hàng
  useEffect(() => {
    const saved = localStorage.getItem("shipping_info");
    if (saved) setShipping(JSON.parse(saved));
  }, []);

  // ==========================================
  // XỬ LÝ THANH TOÁN
  // ==========================================
  const handlePayWithPi = async () => {
    if (!user) {
      alert(t.must_login_before_pay);
      return router.push("/pilogin");
    }

    if (!piReady || !window.Pi) {
      return alert(t.pi_not_ready);
    }

    if (!shipping) {
      alert(t.must_fill_shipping);
      return router.push("/customer/address");
    }

    if (cart.length === 0) {
      return alert(t.cart_empty);
    }

    setLoading(true);

    const orderId = `ORD-${Date.now()}`;

    // 1️⃣ Gọi CREATE — tạo giao dịch trên server
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
      console.error("❌ CREATE ERROR:", createData);
      alert("Không thể khởi tạo giao dịch Pi.");
      setLoading(false);
      return;
    }

    // Lấy paymentId của BACKEND
    const backendPaymentId = createData.paymentId;

    // 2️⃣ Dữ liệu gửi Pi Wallet
    const paymentData = {
      amount: Number(total.toFixed(2)),
      memo: `Payment for order ${orderId}`,

      // METADATA BẮT BUỘC PHẢI CÓ backendPaymentId !!!
      metadata: {
        orderId,
        backendPaymentId, // 🔥 Đây là chìa khóa để server map giao dịch
        buyer: user.username,
      },
    };

    // 3️⃣ CALLBACKS PI SDK
    const callbacks = {
      /** Khi ví đã tạo transaction và chờ server APPROVE */
      onReadyForServerApproval: async (piPaymentId: string) => {
        console.log("📌 onReadyForServerApproval:", piPaymentId);

        await fetch("/api/pi/approve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            paymentId: piPaymentId, // 🔥 DÙNG ID CỦA PI WALLET
          }),
        });
      },

      /** Khi user đã ký giao dịch và chờ server COMPLETE */
      onReadyForServerCompletion: async (piPaymentId: string, txid: string) => {
        console.log("📌 onReadyForServerCompletion:", piPaymentId, txid);

        // Lưu order
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

        // COMPLETE giao dịch trên Pi server
        await fetch("/api/pi/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            paymentId: piPaymentId, // 🔥 PHẢI DÙNG PI PAYMENT ID
            txid,
          }),
        });

        clearCart();
        alert(t.payment_success);
        router.push("/customer/pending");
      },

      onCancel: () => {
        alert(t.payment_canceled);
      },

      onError: (error: Error) => {
        console.error("💥 Payment error:", error);
        alert(`Lỗi thanh toán: ${error.message}`);
      },
    };

    // 4️⃣ Gọi Pi SDK để mở ví
    try {
      await window.Pi!.createPayment(paymentData, callbacks);
    } catch (e) {
      console.error(e);
      alert("Giao dịch thất bại hoặc đã bị hủy.");
    }

    setLoading(false);
  };

  // ==========================================
  // GIAO DIỆN
  // ==========================================
  return (
    <main className="max-w-md mx-auto min-h-screen bg-gray-50 flex flex-col justify-between">
      {/* HEADER */}
      <div className="flex items-center justify-between bg-white p-3 border-b sticky top-0">
        <button onClick={() => router.back()} className="flex items-center text-gray-700">
          <ArrowLeft className="w-5 h-5 mr-1" />
          <span>{t.back}</span>
        </button>
        <h1 className="font-semibold text-gray-800">{t.checkout}</h1>
        <div className="w-5" />
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto pb-32">
        {/* SHIPPING */}
        <div
          className="bg-white border-b p-4 flex justify-between cursor-pointer"
          onClick={() => router.push("/customer/address")}
        >
          {shipping ? (
            <div>
              <p className="font-semibold">{shipping.name}</p>
              <p className="text-gray-600 text-sm">{shipping.phone}</p>
              <p className="text-gray-500 text-sm">
                {shipping.country ? `${shipping.country}, ` : ""}
                {shipping.address}
              </p>
            </div>
          ) : (
            <p className="text-gray-500">➕ {t.add_shipping}</p>
          )}

          <span className="text-blue-500">{t.edit} ➜</span>
        </div>

        {/* CART */}
        <div className="p-4 bg-white mt-2">
          <h2 className="font-semibold mb-3">{t.products}</h2>

          {cart.length === 0 ? (
            <p className="text-gray-500 text-sm">{t.no_products}</p>
          ) : (
            cart.map((item, i) => (
              <div key={i} className="flex items-center border-b py-2">
                <img
                  src={item.image || item.images?.[0] || "/placeholder.png"}
                  className="w-16 h-16 rounded border bg-gray-100 object-cover"
                />

                <div className="ml-3 flex-1">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-gray-500 text-xs">
                    x{item.quantity} × {item.price} π
                  </p>
                </div>

                <p className="text-orange-600 font-semibold">
                  {(item.price * item.quantity).toFixed(2)} π
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* FOOTER */}
      <div className="fixed bottom-16 left-0 right-0 bg-white border-t p-4 flex justify-between max-w-md mx-auto">
        <div>
          <p className="text-gray-600 text-sm">{t.total_label}</p>
          <p className="text-xl font-bold text-orange-600">{total.toFixed(2)} π</p>
        </div>

        <button
          onClick={handlePayWithPi}
          disabled={loading}
          className={`px-6 py-3 rounded-lg text-white font-semibold ${
            loading ? "bg-gray-400" : "bg-orange-600 hover:bg-orange-700"
          }`}
        >
          {loading ? t.processing : t.pay_now}
        </button>
      </div>
    </main>
  );
}
