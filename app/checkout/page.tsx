"use client";

import React, { useEffect, useState } from "react";

export default function CheckoutPage() {
  const [user, setUser] = useState<{ username: string } | null>(null);
  const [product, setProduct] = useState<any>(null);
  const [isPaying, setIsPaying] = useState(false);

  const [country, setCountry] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");

  // 🔹 Lấy thông tin đăng nhập Pi
  useEffect(() => {
    const stored = localStorage.getItem("pi_user");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser(parsed.user);
      } catch {
        setUser(null);
      }
    }
  }, []);

  // 🔹 Lấy dữ liệu sản phẩm từ API
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch("/api/products");
        const data = await res.json();
        // Lấy sản phẩm đầu tiên làm ví dụ
        setProduct(data[0]);
      } catch (error) {
        console.error("❌ Lỗi khi tải sản phẩm:", error);
      }
    };
    fetchProduct();
  }, []);

  // 🔹 Thanh toán qua Pi Testnet
  const handlePayment = async () => {
    if (typeof window === "undefined" || !window.Pi) {
      alert("⚠️ Vui lòng mở trong Pi Browser để thanh toán!");
      return;
    }
    if (!user) {
      alert("⚠️ Bạn cần đăng nhập bằng Pi trước!");
      window.location.href = "/pilogin";
      return;
    }
    if (!country || !address || !phone) {
      alert("⚠️ Vui lòng nhập đầy đủ thông tin giao hàng!");
      return;
    }

    setIsPaying(true);
    try {
      window.Pi.init({ version: "2.0", sandbox: true });

      const paymentData = {
        amount: product?.price || 0.5,
        memo: `Thanh toán ${product?.name}`,
        metadata: { buyer: user.username, country, address, phone },
      };

      const callbacks = {
        onReadyForServerApproval: (paymentId: string) => {
          console.log("✅ Ready for approval:", paymentId);
        },
        onReadyForServerCompletion: (paymentId: string, txid: string) => {
          console.log("✅ Payment completed:", paymentId, txid);
          window.open(`https://wallet-testnet.minepi.com/transaction/${txid}`, "_blank");
        },
        onCancel: (paymentId: string) => {
          console.log("❌ Payment cancelled:", paymentId);
          setIsPaying(false);
        },
        onError: (error: any) => {
          console.error("❌ Payment error:", error);
          setIsPaying(false);
        },
      };

      await window.Pi.createPayment(paymentData, callbacks);
    } catch (err) {
      console.error("Payment failed:", err);
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 flex justify-center py-10 px-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-lg p-6 space-y-6">
        <h1 className="text-2xl font-semibold text-center">Checkout</h1>

        {user ? (
          <p className="text-center text-gray-600">
            👋 Xin chào <strong>{user.username}</strong>
          </p>
        ) : (
          <p className="text-center text-red-500">⚠️ Bạn chưa đăng nhập Pi</p>
        )}

        {product ? (
          <div className="flex items-center gap-4 border p-3 rounded-xl">
            <img
              src={product.images?.[0]}
              alt={product.name}
              className="w-20 h-20 rounded-lg object-cover"
            />
            <div>
              <h2 className="font-semibold">{product.name}</h2>
              <p className="text-gray-600">Price: π{product.price}</p>
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-400">Đang tải sản phẩm...</p>
        )}

        <div className="space-y-3">
          <h3 className="font-semibold text-lg">Thông tin giao hàng</h3>
          <input
            type="text"
            placeholder="Quốc gia"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500"
          />
          <input
            type="text"
            placeholder="Địa chỉ nhận hàng"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500"
          />
          <input
            type="tel"
            placeholder="Số điện thoại"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <div className="border-t border-gray-200"></div>

        {product && (
          <div className="flex justify-between text-lg font-semibold">
            <span>Total:</span>
            <span>π{(product.price * 0.97).toFixed(2)}</span>
          </div>
        )}

        <button
          onClick={handlePayment}
          disabled={isPaying || !product}
          className="w-full bg-orange-500 text-white py-3 rounded-xl font-medium hover:bg-orange-600 disabled:opacity-50"
        >
          {isPaying ? "Processing..." : "Pay with Pi (Testnet)"}
        </button>
      </div>
    </main>
  );
}
