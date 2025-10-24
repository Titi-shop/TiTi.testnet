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
  const [user, setUser] = useState("guest");
  const [shipping, setShipping] = useState<any>(null);

  // ✅ Lấy username đăng nhập
  useEffect(() => {
    const username = localStorage.getItem("titi_username");
    if (username) setUser(username);
  }, []);

  // ✅ Lấy địa chỉ giao hàng
  useEffect(() => {
    const saved = localStorage.getItem("shipping_info");
    if (saved) setShipping(JSON.parse(saved));
  }, []);

  // 💳 Thanh toán
  const handlePay = async () => {
    if (!window.Pi) {
      alert("⚠️ Vui lòng mở trang này trong Pi Browser để thanh toán!");
      return;
    }

    if (!shipping) {
      alert("📦 Vui lòng thêm địa chỉ giao hàng trước!");
      router.push("/customer/address");
      return;
    }

    if (cart.length === 0) {
      alert("🛒 Giỏ hàng của bạn đang trống!");
      return;
    }

    setLoading(true);

    try {
      // 🧹 Kiểm tra và hủy giao dịch pending cũ nếu có
      try {
        const pendings = await window.Pi.getCurrentPayments();
        if (pendings && pendings.length > 0) {
          const last = pendings[0];
          alert(`⚠️ Có giao dịch Pi đang treo (PaymentID: ${last.identifier}). Hệ thống sẽ tự huỷ...`);

          const cancelRes = await fetch("/api/pi/cancel", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentId: last.identifier }),
          });

          const cancelText = await cancelRes.text();
          console.log("🧹 [PENDING CANCEL RESULT]:", cancelRes.status, cancelText);

          if (cancelRes.ok) {
            await new Promise((r) => setTimeout(r, 4000));
            alert("✅ Giao dịch cũ đã được huỷ. Bắt đầu tạo giao dịch mới...");
          } else {
            alert("⚠️ Không thể huỷ giao dịch cũ. Vui lòng thử lại sau 10 giây.");
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn("Không thể truy xuất pending payment:", err);
      }

      // 🚀 Khởi tạo Pi SDK
      window.Pi.init({ version: "2.0", sandbox: false });

      const scopes = ["payments", "username", "wallet_address"];
      const auth = await window.Pi.authenticate(scopes, (res: any) => res);

      const orderId = Date.now();
      const paymentData = {
        amount: total,
        memo: `Thanh toán đơn hàng #${orderId}`,
        metadata: {
          orderId,
          buyer: auth.user?.username || user,
          items: cart,
        },
      };

      const callbacks = {
        onReadyForServerApproval: async (paymentId: string) => {
          console.log("🟡 [APPROVE] Giao dịch:", paymentId);
          await fetch("/api/pi/approve", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentId }),
          });
        },

        onReadyForServerCompletion: async (paymentId: string, txid: string) => {
          console.log("🟢 [COMPLETE] Giao dịch:", paymentId);

          const res = await fetch("/api/pi/complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentId, txid }),
          });

          const result = await res.json();

          if (result?.success || res.ok) {
            const order = {
              id: orderId,
              buyer: auth.user?.username || user,
              items: cart,
              total,
              status: "Đã thanh toán",
              note: `Pi TXID: ${txid}`,
              shipping,
              createdAt: new Date().toISOString(),
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
            alert(result.message || "⚠️ Giao dịch đang chờ xác minh trên Pi Network.");
          }
        },

        onCancel: () => {
          alert("❌ Bạn đã huỷ giao dịch.");
        },

        onError: (error: any) => {
          console.error("💥 Lỗi thanh toán:", error);
          alert("💥 Lỗi thanh toán: " + (error.message || "Không xác định."));
        },
      };

      await window.Pi.createPayment(paymentData, callbacks);
    } catch (err: any) {
      console.error("❌ Lỗi:", err);
      alert("❌ Thanh toán thất bại hoặc bị huỷ: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-md mx-auto min-h-screen bg-gray-50 flex flex-col justify-between">
      {/* Header */}
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

      {/* Nội dung */}
      <div className="flex-1 overflow-y-auto pb-24">
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
          <h2 className="font-semibold text-gray-800 mb-2">Sản phẩm</h2>
          {cart.length === 0 ? (
            <p className="text-gray-500 text-sm">Không có sản phẩm nào.</p>
          ) : (
            <div className="space-y-3">
              {cart.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center border-b border-gray-100 pb-2 hover:bg-gray-50 rounded"
                  onClick={() => router.push(`/product/${item.id}`)}
                >
                  <img
                    src={item.image || "/placeholder.png"}
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded border"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/placeholder.png";
                    }}
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

      {/* Thanh tổng cộng */}
      <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-200 p-4 flex justify-between items-center max-w-md mx-auto">
        <div>
          <p className="text-gray-600 text-sm">Tổng cộng:</p>
          <p className="text-xl font-bold text-orange-600">{total.toFixed(2)} Pi</p>
        </div>
        <button
          onClick={handlePay}
          disabled={loading}
          className={`px-6 py-3 rounded-lg font-semibold text-white text-sm ${
            loading ? "bg-gray-400" : "bg-orange-600 hover:bg-orange-700 active:bg-orange-800"
          }`}
        >
          {loading ? "Đang xử lý..." : "Pay Now"}
        </button>
      </div>
    </main>
  );
}
