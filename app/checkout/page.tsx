"use client";
import { useEffect, useState } from "react";
import { useCart } from "../context/CartContext";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

declare global { interface Window { Pi?: any; } }

export default function CheckoutPage() {
  const { cart, clearCart, total } = useCart();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [shipping, setShipping] = useState<any>(null);

  useEffect(() => {
  try {
    const piUser = localStorage.getItem("pi_user");
    if (piUser) {
      const userData = JSON.parse(piUser);
      setUser(userData.username || "guest");
    } else {
      const username = localStorage.getItem("titi_username");
      if (username) setUser(username);
    }
  } catch {
    setUser("guest");
  }
}, []);

  useEffect(() => {
    const saved = localStorage.getItem("shipping_info");
    if (saved) setShipping(JSON.parse(saved));
  }, []);

  const handlePay = async () => {
    if (!user) {
      alert("⚠️ Vui lòng đăng nhập bằng Pi Network trước khi thanh toán!");
      router.push("/pilogin");
      return;
    }

    if (!window.Pi) {
      alert("⚠️ Mở trang trong Pi Browser để thanh toán!");
      return;
    }

    if (!shipping) {
      alert("📦 Vui lòng thêm địa chỉ giao hàng!");
      router.push("/customer/address");
      return;
    }

    if (cart.length === 0) {
      alert("🛒 Giỏ hàng trống!");
      return;
    }

    setLoading(true);

    try {
      // 🧹 Huỷ pending payment nếu có
      try {
        const pending = await window.Pi.getCurrentPayments();
        if (pending && pending.length > 0) {
          const last = pending[0];
          await fetch("/api/pi/cancel", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentId: last.identifier }),
          });
          alert("Đã huỷ giao dịch cũ, sẵn sàng thanh toán mới.");
        }
      } catch {}

      window.Pi.init({ version: "2.0", sandbox: false });
      const scopes = ["payments", "username", "wallet_address"];
      const auth = await window.Pi.authenticate(scopes, (res: any) => res);

      const orderId = Date.now();
      const paymentData = {
        amount: total,
        memo: `Thanh toán đơn hàng #${orderId}`,
        metadata: {
          orderId,
          buyer: user.username,
          uid: user.uid,
          items: cart,
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
          const data = await res.json();

          if (res.ok && (data?.success || true)) {
            const order = {
              id: orderId,
              buyer: user.username,
              items: cart,
              total,
              status: "Đã thanh toán",
              shipping,
              note: `Pi TXID: ${txid}`,
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
        onCancel: () => alert("❌ Bạn đã huỷ giao dịch."),
        onError: (err: any) => alert("💥 Lỗi: " + err.message),
      };

      await window.Pi.createPayment(paymentData, callbacks);
    } catch (err: any) {
      alert("❌ Lỗi thanh toán: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-md mx-auto min-h-screen bg-gray-50 flex flex-col justify-between">
      <div className="flex items-center justify-between bg-white p-3 border-b sticky top-0 z-10">
        <button onClick={() => router.back()} className="flex items-center text-gray-700 hover:text-blue-600">
          <ArrowLeft className="w-5 h-5 mr-1" /> <span>Back</span>
        </button>
        <h1 className="font-semibold text-gray-800">Thanh toán</h1>
        <div className="w-5" />
      </div>
      {/* ... Giữ nguyên phần UI hiển thị sản phẩm & tổng tiền */}
      <div className="fixed bottom-16 left-0 right-0 bg-white border-t p-4 flex justify-between items-center max-w-md mx-auto">
        <div>
          <p className="text-gray-600 text-sm">Tổng cộng:</p>
          <p className="text-xl font-bold text-orange-600">{total.toFixed(2)} Pi</p>
        </div>
        <button
          onClick={handlePay}
          disabled={loading}
          className={`px-6 py-3 rounded-lg font-semibold text-white text-sm ${
            loading ? "bg-gray-400" : "bg-orange-600 hover:bg-orange-700"
          }`}
        >
          {loading ? "Đang xử lý..." : "Pay Now"}
        </button>
      </div>
    </main>
  );
}
