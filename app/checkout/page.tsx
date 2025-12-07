"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "../context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft } from "lucide-react";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";

export default function CheckoutPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { cart, total, clearCart } = useCart();
  const { user, piReady } = useAuth();

  const [shipping, setShipping] = useState(null);
  const [loading, setLoading] = useState(false);

  // BẮT BUỘC: kích hoạt Pi SDK testnet
  useEffect(() => {
    if (window.Pi) {
      window.Pi.init({
        version: "2.0",
        sandbox: true, 
      });
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("shipping_info");
    if (saved) setShipping(JSON.parse(saved));
  }, []);

  // ===============================
  // 🔥 XỬ LÝ THANH TOÁN
  // ===============================
  const handlePayWithPi = async () => {
    if (!user) return router.push("/pilogin");
    if (!piReady || !window.Pi) return alert(t.pi_not_ready);
    if (!shipping) return router.push("/customer/address");
    if (cart.length === 0) return alert(t.cart_empty);

    setLoading(true);

    const orderId = `ORD-${Date.now()}`;

    // 1️⃣ GỌI API CREATE — TRẢ VỀ paymentId NỘI BỘ
    const createRes = await fetch("/api/pi/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        amount: Number(total.toFixed(2)),
        orderId,
        buyer: user.username,
        items: cart,
        shipping
      }),
    });

    const createData = await createRes.json();

    if (!createData.success) {
      alert("Không thể tạo giao dịch!");
      setLoading(false);
      return;
    }

    const backendPaymentId = createData.paymentId;

    // 2️⃣ DỮ LIỆU GỬI PI WALLET
    const paymentData = {
      amount: Number(total.toFixed(2)),
      memo: `Payment for ${orderId}`,
      metadata: { orderId, buyer: user.username },
    };

    // 3️⃣ CALLBACK CHUẨN
    const callbacks = {
      onReadyForServerApproval: async (piPaymentId) => {
        console.log("📌 Pi SDK ready → server approve");

        await fetch("/api/pi/approve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentId: backendPaymentId, 
            piPaymentId,                 // quan trọng nhất!
          }),
        });
      },

      onReadyForServerCompletion: async (piPaymentId, txid) => {
        console.log("📌 Pi SDK completion");

        await fetch("/api/pi/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentId: backendPaymentId,
            piPaymentId,
            txid,
          }),
        });

        clearCart();
        alert("Thanh toán thành công!");
        router.push("/customer/pending");
      },

      onCancel: () => alert("Bạn đã hủy giao dịch"),
      onError: (err) => alert(err.message),
    };

    // 4️⃣ MỞ VÍ PI
    try {
      console.log("📌 Opening Pi Wallet...");
      await window.Pi.createPayment(paymentData, callbacks);
    } catch (err) {
      console.error(err);
      alert("Không thể mở ví Pi.");
    }

    setLoading(false);
  };

  return (
    <main className="max-w-md mx-auto">
      <button onClick={handlePayWithPi} disabled={loading}>
        Pay {total} π
      </button>
    </main>
  );
}
