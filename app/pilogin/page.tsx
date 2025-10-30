"use client";
import { useEffect, useState } from "react";

export default function PiLoginPage() {
  const [status, setStatus] = useState("⏳ Đang tải Pi SDK...");
  const [ready, setReady] = useState(false);

  useEffect(() => {
  const timer = setInterval(() => {
    if (typeof window !== "undefined") {
      console.log("🔍 window.Pi =", window.Pi);
    }
  }, 2000);
  return () => clearInterval(timer);
}, []);

  const handleLogin = async () => {
    if (!window.Pi) {
      alert("⚠️ Vui lòng mở bằng Pi Browser!");
      return;
    }

    try {
      setStatus("🔐 Đang đăng nhập...");
      const scopes = ["username", "payments", "wallet_address"];
      const auth = await window.Pi.authenticate(scopes, (payment) => {
        console.log("💸 Callback:", payment);
      });

      const username = auth?.user?.username || "guest";
      localStorage.setItem("pi_user", JSON.stringify(auth));
      localStorage.setItem("titi_is_logged_in", "true");

      setStatus(`🎉 Xin chào ${username}`);
      alert(`🎉 Đăng nhập thành công: ${username}`);
    } catch (e) {
      console.error("❌ Lỗi đăng nhập:", e);
      setStatus("❌ Lỗi đăng nhập: " + e.message);
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
      <h1 className="text-2xl font-bold text-orange-600 mb-4">🔐 Đăng nhập bằng Pi Network</h1>
      <p className="mb-6 text-gray-700">{status}</p>
      {ready && (
        <button
          onClick={handleLogin}
          className="bg-orange-500 text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-orange-600 transition"
        >
          Đăng nhập với Pi
        </button>
      )}
    </main>
  );
}
