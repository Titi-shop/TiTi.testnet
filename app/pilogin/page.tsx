"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function PiLoginPage() {
  const { user, piReady, login } = useAuth();
  const [status, setStatus] = useState("⏳ Đang tải...");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!piReady) {
      setStatus("⚠️ Chờ Pi SDK khởi động...");
    } else if (user) {
      setStatus(`🎉 Xin chào ${user.username}`);
    } else {
      setStatus("🔐 Chưa đăng nhập");
    }
  }, [piReady, user]);

  const handleLogin = async () => {
    if (!piReady || !window.Pi) {
      alert("⚠️ Vui lòng mở bằng Pi Browser và chờ SDK load xong!");
      return;
    }

    try {
      setStatus("🔐 Đang đăng nhập...");
      await login();
      setStatus("🎉 Đăng nhập thành công!");
    } catch (err: any) {
      console.error("❌ Lỗi đăng nhập:", err);
      setStatus("❌ Lỗi đăng nhập: " + (err.message || "Không rõ nguyên nhân"));
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
      <h1 className="text-2xl font-bold mb-4 text-orange-600">
        🔐 Đăng nhập bằng Pi Network
      </h1>
      <p className="mb-4">{status}</p>

      <button
        onClick={handleLogin}
        disabled={!piReady}
        className={`px-6 py-3 rounded-lg text-white transition ${
          piReady
            ? "bg-orange-500 hover:bg-orange-600"
            : "bg-gray-400 cursor-not-allowed"
        }`}
      >
        Đăng nhập với Pi
      </button>
    </main>
  );
}
