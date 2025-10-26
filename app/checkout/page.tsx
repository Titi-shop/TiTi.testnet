"use client";

import { useEffect, useState } from "react";
import { useCart } from "../context/CartContext";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

declare global {
  interface Window {
    Pi?: any;
    Pi_initialized?: boolean;
  }
}

export default function CheckoutPage() {
  const { cart, clearCart, total } = useCart();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [shipping, setShipping] = useState<any>(null);

  // ✅ Lấy thông tin user (đã đăng nhập Pi)
  useEffect(() => {
    try {
      const saved = localStorage.getItem("pi_user");
      if (saved) setUser(JSON.parse(saved));
    } catch (e) {
      console.error("❌ Lỗi đọc user:", e);
    }
  }, []);

  // ✅ Lấy địa chỉ giao hàng
  useEffect(() => {
    const saved = localStorage.getItem("shipping_info");
    if (saved) setShipping(JSON.parse(saved));
  }, []);

  // 💰 Xử lý thanh toán Pi
  const handlePay = async () => {
    if (!window.Pi) {
      alert("⚠️ Vui lòng mở bằng Pi Browser để thanh toán!");
      return;
    }
    if (!user) {
      alert("🔑 Bạn cần đăng nhập Pi Network trước khi thanh toán!");
      router.push("/pilogin");
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
      // ✅ Chỉ khởi tạo Pi SDK nếu chưa có
      if (!window.Pi_initialized) {
        const isSandbox =
          process.env.NEXT_PUBLIC_PI_ENV === "sandbox" ||
          process.env.NEXT_PUBLIC_PI_API_URL?.includes("/sandbox");
        await window.Pi.init({ version: "2.0", sandbox: isSandbox });
        window.Pi_initialized = true;
        console.log("✅ Pi SDK initialized (checkout)");
      }

      const orderId = `ORD-${Date.now()}`;
      const paymentData = {
        amount: total.toFixed(2),
        memo: `Thanh toán đơn hàng #${orderId}`,
        metadata: {
          orderId,
          buyer: user.username,
          uid: user.uid,
          cart,
        },
      };

      // ✅ Gọi backend tạo payment
      const createRes = await fetch("/api/pi/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentData),
      });

      const payment = await createRes.json();
      console.log("📦 [Pi CREATE RESULT]:", payment);

      if (!payment.identifier && !payment.id) {
        throw new Error("Không thể tạo giao dịch trên Pi Network!");
      }

      // ✅ Callback xử lý các bước thanh toán
      const callbacks = {
        onReadyForServerApproval: async (paymentId: string) => {
          console.log("⏳ [APPROVE]", paymentId);
          await fetch("/api/pi/approve", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentId }),
          });
        },

        onReadyForServerCompletion: async (paymentId: string, txid: string) => {
          console.log("✅ [COMPLETE]", paymentId, txid);

          // Lưu đơn hàng
          await fetch("/api/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: orderId,
              buyer: user.username,
              total,
              items: cart,
              txid,
              shipping,
              status: "Đã thanh toán",
              createdAt: new Date().toISOString(),
            }),
          });

          // Hoàn tất giao dịch
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
          console.log("🛑 [CANCEL]", paymentId);
          await fetch("/api/pi/cancel", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentId }),
          });
          alert("❌ Giao dịch đã bị hủy!");
        },

        onError: (error: any) => {
          console.error("💥 [ERROR]", error);
          alert("❌ Lỗi: " + error.message);
        },
      };

      // ✅ Gọi thanh toán bằng Pi SDK
      await window.Pi.createPayment(paymentData, callbacks);
    } catch (err: any) {
      console.error("💥 Giao dịch thất bại:", err);
      alert("❌ Thanh toán thất bại: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ---------------- UI ----------------
  return (
    <main className="max-w-md mx-auto min-h-screen bg-gray-50 flex flex-col justify-between">
      {/* Thanh điều hướng */}
      <div className="flex items-center justify-between bg-white p-3 border-b sticky top-0 z-10">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-700 hover:text-blue-600"
        >
          <ArrowLeft className="w-5 h-5 mr-1" />
          <span>Back</span>
        </button>
        <h1 className="font-semibold text-gray-800">Thanh toán</h1>
        <div className="w-5" />
      </div>

      {/* Thông tin */}
      <div className="flex-1 overflow-y-auto pb-28">
        {/* Địa chỉ */}
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

        {/* Giỏ hàng */}
        <div className="p-4 bg-white mt-2 border-t">
          <h2 className="font-semibold text-gray-800 mb-2">Giỏ hàng</h2>
          {cart.length === 0 ? (
            <p className="text-gray-500 text-sm">Không có sản phẩm nào.</p>
          ) : (
            <div className="space-y-3">
              {cart.map((item, i) => (
                <div key={i} className="flex items-center border-b pb-2">
                  <img
                    src={
                      item.image?.startsWith("http")
                        ? item.image
                        : `https://muasam.titi.onl${item.image || ""}`
                    }
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded border bg-gray-100"
                  />
                  <div className="ml-3 flex-1">
                    <p className="text-gray-800 font-medium text-sm">{item.name}</p>
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

      {/* Nút thanh toán */}
      <div className="fixed bottom-16 left-0 right-0 bg-white border-t p-4 flex justify-between items-center max-w-md mx-auto">
        <div>
          <p className="text-gray-600 text-sm">Tổng cộng:</p>
          <p className="text-xl font-bold text-orange-600">
            {total.toFixed(2)} Pi
          </p>
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
