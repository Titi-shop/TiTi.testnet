"use client";

import React, { useEffect, useState } from "react";

export default function CheckoutPage() {
  const [user, setUser] = useState<{ username: string } | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [sdkLoaded, setSdkLoaded] = useState(false);

  const [country, setCountry] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");

  const [product, setProduct] = useState<any>(null);

  // 🧩 Lấy thông tin người dùng Pi từ localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("pi_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        setUser(parsed.user || null);
      }
    } catch (err) {
      console.error("Error reading user:", err);
    }
  }, []);

  // 🧩 Lấy sản phẩm demo
  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setProduct(data[0]);
        }
      })
      .catch((err) => console.error("Fetch product error:", err));
  }, []);

  // 🧩 Khởi tạo SDK Pi
  useEffect(() => {
    if (typeof window !== "undefined" && window.Pi && !sdkLoaded) {
      try {
        window.Pi.init({
          version: "2.0",
          sandbox: true, // ⚠️ Testnet mode
          appId: "muasam.titi.onl", // 🔹 Thay bằng App ID thật của bạn
        });
        setSdkLoaded(true);
      } catch (err) {
        console.error("Pi init error:", err);
      }
    }
  }, [sdkLoaded]);

  // 🧾 Xử lý thanh toán
  const handlePayment = async () => {
    if (typeof window === "undefined" || !window.Pi) {
      alert("⚠️ Vui lòng mở trong Pi Browser để thanh toán!");
      return;
    }

    // ✅ Bắt buộc xác thực lại với scope "payments"
    let auth;
    try {
      auth = await window.Pi.authenticate(
        ["username", "payments", "wallet_address"],
        () => {}
      );
      console.log("🔐 Re-authenticated:", auth);
    } catch (err) {
      console.error("Auth error:", err);
      alert("Không thể xác thực Pi user. Hãy đăng nhập lại.");
      window.location.href = "/pilogin";
      return;
    }

    const username = auth?.user?.username;
    if (!username) {
      alert("Không tìm thấy tài khoản Pi, vui lòng đăng nhập lại!");
      return;
    }

    if (!country || !address || !phone) {
      alert("⚠️ Vui lòng nhập đầy đủ thông tin giao hàng!");
      return;
    }

    if (!product) {
      alert("⚠️ Không tìm thấy sản phẩm!");
      return;
    }

    setIsPaying(true);

    try {
      const paymentData = {
        amount: product.price || 0.97,
        memo: `Mua hàng: ${product.name}`,
        metadata: {
          buyer: username,
          country,
          address,
          phone,
          productId: product.id,
        },
      };

      // 🧩 Gọi API duyệt & hoàn tất thanh toán
      const callbacks = {
        onReadyForServerApproval: async (paymentId: string) => {
          console.log("✅ Approving payment:", paymentId);
          await fetch("/api/pi/approve", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentId }),
          });
        },
        onReadyForServerCompletion: async (paymentId: string, txid: string) => {
          console.log("🏁 Completing payment:", paymentId, txid);
          await fetch("/api/pi/complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentId, txid }),
          });
          alert("🎉 Thanh toán thành công!");
        },
        onCancel: (id: string) => alert("❌ Bạn đã hủy giao dịch."),
        onError: (error: any) => alert("💥 Lỗi thanh toán: " + error.message),
      };

      await window.Pi.createPayment(paymentData, callbacks);
    } catch (err: any) {
      console.error("Payment failed:", err);
      alert("Thanh toán thất bại: " + (err?.message || JSON.stringify(err)));
    } finally {
      setIsPaying(false);
    }
  };

  // 🧱 Giao diện chính
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

        <p className="text-center text-sm">
          SDK status: {sdkLoaded ? "✅ Loaded" : "❌ Not loaded"}
        </p>

        {product && (
          <div className="flex items-center gap-4 border p-3 rounded-xl">
            <img
              src={product.images?.[0]}
              alt={product.name}
              className="w-20 h-20 rounded-lg object-cover bg-gray-100"
            />
            <div>
              <h2 className="font-semibold">{product.name}</h2>
              <p className="text-gray-600">Price: π{product.price}</p>
            </div>
          </div>
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

        <div className="flex justify-between text-lg font-semibold">
          <span>Total:</span>
          <span>π{product?.price || 0.97}</span>
        </div>

        <button
          onClick={handlePayment}
          disabled={isPaying}
          className="w-full bg-orange-500 text-white py-3 rounded-xl font-medium hover:bg-orange-600 disabled:opacity-50"
        >
          {isPaying ? "Processing..." : "Pay with Pi (Testnet)"}
        </button>
      </div>
    </main>
  );
}
