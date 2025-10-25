"use client";

import { useEffect, useState } from "react";
import { useCart } from "../context/CartContext";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

declare global {
  interface Window {
    Pi?: any;
  }
}

export default function CheckoutPage() {
  const { cart, clearCart, total } = useCart();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<string | null>(null);
  const [shipping, setShipping] = useState<any>(null);

  // ✅ Lấy thông tin user từ localStorage (đồng bộ với PiSessionWatcher)
  useEffect(() => {
    const piUser = localStorage.getItem("pi_user");
    const username = localStorage.getItem("titi_username");
    if (piUser || username) {
      setUser(username || JSON.parse(piUser || "{}")?.username);
    }
  }, []);

  // ✅ Lấy địa chỉ giao hàng
  useEffect(() => {
    const saved = localStorage.getItem("shipping_info");
    if (saved) setShipping(JSON.parse(saved));
  }, []);

  // 💰 Thanh toán qua Pi Network
  const handlePay = async () => {
    if (!window.Pi) {
      alert("⚠️ Vui lòng mở website bằng Pi Browser để thanh toán!");
      return;
    }

    if (!user) {
      alert("🔑 Vui lòng đăng nhập bằng Pi Network trước khi thanh toán!");
      router.push("/login");
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
      // ✅ Khởi tạo SDK
      window.Pi.init({ version: "2.0", sandbox: true });

      // ✅ Tạo giao dịch mới từ server
      const orderId = `ORD-${Date.now()}`;
      const paymentRequest = {
        amount: total.toFixed(2),
        memo: `Thanh toán đơn hàng #${orderId}`,
        metadata: { orderId, buyer: user, cart },
      };

      // Gọi API tạo payment
      const createRes = await fetch("/api/pi/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentRequest),
      });
      const payment = await createRes.json();

      if (!payment.identifier) {
        throw new Error("Không tạo được giao dịch trên Pi Network");
      }

      console.log("✅ Payment created:", payment);

      // ✅ Callback xử lý các bước thanh toán
      const callbacks = {
        onReadyForServerApproval: async (paymentId: string) => {
          console.log("⏳ Đang gửi yêu cầu APPROVE:", paymentId);
          await fetch("/api/pi/approve", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentId }),
          });
        },
        onReadyForServerCompletion: async (paymentId: string, txid: string) => {
          console.log("✅ Hoàn tất thanh toán:", paymentId, txid);

          // Ghi đơn hàng vào database
          const order = {
            id: orderId,
            buyer: user,
            total,
            items: cart,
            status: "Đã thanh toán",
            txid,
            shipping,
            createdAt: new Date().toISOString(),
          };
          await fetch("/api/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(order),
          });

          // Gửi complete đến Pi API
          await fetch("/api/pi/complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentId, txid }),
          });

          clearCart();
          alert("✅ Thanh toán thành công!");
          router.push("/customer/pending");
        },
        onCancel: async (paymentId: string) => {
          console.log("🛑 Hủy thanh toán:", paymentId);
          await fetch("/api/pi/cancel", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentId }),
          });
          alert("❌ Giao dịch đã bị hủy!");
        },
        onError: (error: any) => {
          console.error("💥 Lỗi thanh toán:", error);
          alert("❌ Lỗi: " + error.message);
        },
      };

      // ✅ Gọi Pi SDK để tạo thanh toán
      await window.Pi.createPayment(paymentRequest, callbacks);
    } catch (err: any) {
      console.error("💥 Giao dịch thất bại:", err);
      alert("❌ Thanh toán thất bại: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ----------------- UI -----------------
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

      {/* Nội dung chính */}
      <div className="flex-1 overflow-y-auto pb-28">
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

        {/* Giỏ hàng */}
        <div className="p-4 bg-white mt-2 border-t">
          <h2 className="font-semibold text-gray-800 mb-2">Giỏ hàng</h2>
          {cart.length === 0 ? (
            <p className="text-gray-500 text-sm">Không có sản phẩm nào.</p>
          ) : (
            <div className="space-y-3">
              {cart.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center border-b border-gray-100 pb-2"
                >
                  <img
                    src={
                      item.image?.startsWith("http")
                        ? item.image
                        : `https://muasam.titi.onl${item.image || ""}`
                    }
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded border bg-gray-100"
                    onError={(e) =>
                      ((e.target as HTMLImageElement).src = "/placeholder.png")
                    }
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

      {/* Thanh tổng cộng + nút thanh toán */}
      <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-200 p-4 flex justify-between items-center max-w-md mx-auto">
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
