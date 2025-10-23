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

  // ✅ Lấy thông tin người dùng
  useEffect(() => {
    try {
      const username = localStorage.getItem("titi_username");
      if (username) setUser(username);
    } catch {}
  }, []);

  // ✅ Lấy địa chỉ giao hàng
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
          buyer: auth.user?.username || user,
          items: cart,
        },
      };

      // 🔥 Các callback từ Pi SDK
      const callbacks = {
        // ❌ Không lưu đơn hàng ở đây — chỉ xác nhận chuẩn bị thanh toán
        onReadyForServerApproval: async (paymentId: string) => {
          console.log("📩 Chờ xác nhận server:", paymentId);
        },

        // ✅ Khi người dùng thanh toán thành công trong ví Pi
        onReadyForServerCompletion: async (paymentId: string, txid: string) => {
          console.log("✅ Pi thanh toán thành công:", { paymentId, txid });

          // Gọi server để xác minh Pi transaction
          const verifyRes = await fetch("/api/pi/complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentId, txid }),
          });
          const verifyData = await verifyRes.json();

          if (verifyData?.success) {
            // ✅ Chỉ lưu đơn khi Pi xác nhận hợp lệ
            const order = {
              id: orderId,
              buyer: auth.user?.username || user,
              items: cart,
              total,
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
            alert("⚠️ Giao dịch chưa được xác minh. Vui lòng thử lại!");
          }
        },

        onCancel: () => {
          console.warn("❌ Người dùng đã huỷ giao dịch.");
          alert("Giao dịch bị huỷ.");
        },

        onError: (error: any) => {
          console.error("💥 Lỗi thanh toán:", error);
          alert("Lỗi trong quá trình thanh toán: " + error.message);
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

  // ✅ Chuẩn hoá link ảnh từ Vercel (nếu chưa có domain)
  const getImageUrl = (url: string) => {
    if (!url) return "/placeholder.png";
    if (url.startsWith("http")) return url;
    return `https://muasam-titi.vercel.app${url}`;
  };

  return (
    <main className="max-w-md mx-auto min-h-screen bg-gray-50 flex flex-col justify-between">
      {/* 🔹 Thanh điều hướng */}
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

      {/* 🔹 Nội dung chính */}
      <div className="flex-1 overflow-y-auto pb-24">
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
          <h2 className="font-semibold text-gray-800 mb-2">Sản phẩm</h2>
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
                    src={getImageUrl(item.image)}
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded border"
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

      {/* 🔹 Thanh tổng cộng + nút thanh toán */}
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
