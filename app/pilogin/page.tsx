"use client";
import { useState } from "react";

export default function PiLoginPage() {
  const [status, setStatus] = useState("⏳ Đang tải...");

  const handleLogin = async () => {
    if (!window.Pi) {
      alert("⚠️ Vui lòng mở bằng Pi Browser!");
      return;
    }

    try {
      setStatus("🔐 Đang đăng nhập...");
      const scopes = ["username", "payments", "wallet_address"];
      const auth = await window.Pi.authenticate(scopes, (payment) => {
        console.log("💸 Payment callback:", payment);
      });

      console.log("✅ Đăng nhập thành công:", auth);
      const username = auth?.user?.username || "guest";
      localStorage.setItem("pi_user", JSON.stringify(auth));
      alert(`🎉 Xin chào ${username}`);
      setStatus(`🎉 Xin chào ${username}`);
    } catch (err) {
      console.error("❌ Lỗi đăng nhập:", err);
      setStatus("❌ Lỗi đăng nhập: " + err.message);
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-6">
      <h1 className="text-2xl font-bold mb-4 text-orange-600">🔐 Đăng nhập bằng Pi Network</h1>
      <p className="mb-4">{status}</p>
      <button
        onClick={handleLogin}
        className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition"
      >
        Đăng nhập với Pi
      </button>
    </main>
  );
}
