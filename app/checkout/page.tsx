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

  // 🧩 Lấy sản phẩm demo (bạn có thể thay API thật ở đây)
  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setProduct(data[0]); // chọn sản phẩm đầu tiên
        }
      })
      .catch((err) => console.error("Fetch product error:", err));
  }, []);

  // 🧩 Khởi tạo SDK Pi khi window.Pi sẵn sàng
  useEffect(() => {
    if (typeof window !== "undefined" && window.Pi && !sdkLoaded) {
      try {
        window.Pi.init({
          version: "2.0",
          sandbox: true, // ⚠️ Testnet mode
          appId: "muasam.titi.onl", // 🔹 Thay bằng App ID thật
        });
        setSdkLoaded(true);
      } catch (err) {
        console.error("Pi init error:", err);
      }
    }
  }, [sdkLoaded]);

  // 🧩 Thanh toán
      const handlePayment = async () => {
  if (typeof window === "undefined" || !window.Pi) {
    alert("⚠️ Vui lòng mở trong Pi Browser để thanh toán!");
    return;
  }

  // ✅ Bắt buộc re-authenticate để lấy lại scope "payments"
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
