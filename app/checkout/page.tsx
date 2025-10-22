"use client";

import React, { useEffect, useState } from "react";

export default function CheckoutPage() {
  const [user, setUser] = useState<{ username: string } | null>(null);
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [isPaying, setIsPaying] = useState(false);

  const [country, setCountry] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [product, setProduct] = useState<any>(null);

  // 🧠 1. Lấy thông tin user từ localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("pi_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        setUser(parsed.user || null);
      }
    } catch (err) {
      console.error("User parse error:", err);
    }
  }, []);

  // 🧠 2. Lấy thông tin profile nếu có
  useEffect(() => {
    try {
      const profile = localStorage.getItem("titi_profile");
      if (profile) {
        const parsed = JSON.parse(profile);
        setCountry(parsed.country || "");
        setAddress(parsed.address || "");
        setPhone(parsed.phone || "");
      }
    } catch (err) {
      console.error("Profile parse error:", err);
    }
  }, []);

  // 🧩 3. Lấy sản phẩm mẫu
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

  // 🧩 4. Khởi tạo SDK
  useEffect(() => {
    if (typeof window !== "undefined" && window.Pi && !sdkLoaded) {
      try {
        window.Pi.init({
          version: "2.0",
          sandbox: true,
          appId: "muasam.titi.onl",
        });
        setSdkLoaded(true);
      } catch (err) {
        console.error("Pi init error:", err);
      }
    }
  }, [sdkLoaded]);

  // 🧾 5. Hàm thanh toán
  const handlePayment = async () => {
    if (!sdkLoaded || !window.Pi) {
      alert("⚠️ SDK Pi chưa sẵn sàng! Hãy đợi vài giây rồi thử lại.");
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

    // 💾 Lưu lại thông tin người dùng
    localStorage.setItem(
      "titi_profile",
      JSON.stringify({ country, address, phone })
    );

    setIsPaying(true);

    try {
      const auth = await window.Pi.authenticate(
        ["username", "payments", "wallet_address"],
        () => {}
      );
      const username = auth?.user?.username || "unknown_user";

      const paymentData = {
        amount: product?.price || 0.97,
        memo: `Thanh toán sản phẩm: ${product?.name}`,
        metadata: {
          buyer: username,
          country,
          address,
          phone,
          productId: product?.id,
        },
      };

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
        onCancel: () => alert("❌ Giao dịch đã bị hủy."),
        onError: (error: any) => alert("💥 Lỗi thanh toán: " + error.message),
      };

      await window.Pi.createPayment(paymentData, callbacks);
    } catch (err: any) {
      console.error("Payment error:", err);
      alert("Thanh toán thất bại: " + (err?.message || "Không rõ lỗi."));
    } finally {
      setIsPaying(false);
    }
  };

  // 🧱 Giao diện
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
          <span>Tổng:</span>
          <span>π{product?.price || 0.97}</span>
        </div>

        <button
          onClick={handlePayment}
          disabled={isPaying || !sdkLoaded}
          className="w-full bg-orange-500 text-white py-3 rounded-xl font-medium hover:bg-orange-600 disabled:opacity-50"
        >
          {isPaying ? "Đang xử lý..." : "Thanh toán bằng Pi (Testnet)"}
        </button>
      </div>
    </main>
  );
}
