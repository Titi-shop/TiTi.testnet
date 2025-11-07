"use client";
import { useState, useEffect } from "react";

export default function PiFix() {
  const [status, setStatus] = useState("⏳ Đang khởi tạo Pi SDK...");
  const [username, setUsername] = useState("");

  useEffect(() => {
    if (!window.Pi) {
      setStatus("⚠️ Không tìm thấy Pi SDK. Hãy mở trang này trong Pi Browser.");
      return;
    }
    window.Pi.init({ version: "2.0", sandbox: true });
    setStatus("✅ Pi SDK đã sẵn sàng.");
  }, []);

  const handleLogin = async () => {
    try {
      const scopes = ["username", "payments"];
      const auth = await window.Pi.authenticate(scopes, () => {});
      setUsername(auth.user.username);
      setStatus(`✅ Đăng nhập thành công: ${auth.user.username}`);
    } catch (err) {
      setStatus("❌ Lỗi đăng nhập: " + err.message);
    }
  };

  const handleFix = async () => {
    if (!username) return alert("Vui lòng đăng nhập Pi trước!");
    setStatus("🧹 Đang xử lý đơn hàng pending...");
    try {
      const res = await fetch("/api/pi/fix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      const data = await res.json();
      setStatus(data.ok ? `✅ ${data.message}` : `❌ ${data.error}`);
    } catch (err) {
      setStatus("💥 Lỗi: " + err.message);
    }
  };

  return (
    <div className="p-6 text-center">
      <h1 className="text-2xl font-bold text-purple-700 mb-4">
        🧹 Fix Pending Payments
      </h1>

      <button
        onClick={handleLogin}
        className="bg-orange-500 text-white px-4 py-2 rounded m-2"
      >
        🔑 Đăng nhập Pi
      </button>

      <button
        onClick={handleFix}
        className="bg-purple-600 text-white px-4 py-2 rounded m-2"
      >
        💳 Hủy đơn pending
      </button>

      <p className="mt-4 text-gray-700">{status}</p>
      {username && (
        <p className="text-sm text-green-700">👤 User: {username}</p>
      )}
    </div>
  );
}
