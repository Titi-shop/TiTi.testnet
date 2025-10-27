"use client";
import { useEffect, useState } from "react";

declare global {
  interface Window {
    Pi?: any;
    __pi_initialized?: boolean;
  }
}

export default function PiLoginPage() {
  const [piReady, setPiReady] = useState(false);
  const [status, setStatus] = useState("⏳ Đang tải Pi SDK...");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const initPi = async () => {
      try {
        // ⏳ Đợi Pi SDK load
        let tries = 0;
        const wait = setInterval(() => {
          if (window.Pi) {
            clearInterval(wait);

            // ✅ Chỉ init một lần duy nhất
            if (!window.__pi_initialized) {
              const isTestnet = process.env.NEXT_PUBLIC_PI_ENV === "testnet";
              window.Pi.init({ version: "2.0", sandbox: isTestnet });
              window.__pi_initialized = true;
              console.log(`✅ Pi.init done (${isTestnet ? "TESTNET" : "MAINNET"})`);
            }

            setPiReady(true);
            setStatus("✅ Pi SDK đã sẵn sàng! Nhấn đăng nhập bên dưới 👇");
          } else if (tries++ > 15) {
            clearInterval(wait);
            setStatus("⚠️ Không phát hiện Pi SDK. Hãy mở bằng Pi Browser.");
          }
        }, 400);
      } catch (err: any) {
        console.error("❌ Lỗi init Pi:", err);
        setStatus("❌ Lỗi khởi tạo Pi: " + err.message);
      }
    };

    initPi();
  }, []);

  const handleLogin = async () => {
    if (!window.Pi) {
      alert("⚠️ Vui lòng mở trang này trong Pi Browser.");
      return;
    }

    try {
      setStatus("🔐 Đang đăng nhập...");
      const scopes = ["username", "payments", "wallet_address"];
      const auth = await window.Pi.authenticate(scopes, (payment: any) => {
        console.log("💸 Payment callback:", payment);
      });

      console.log("✅ Đăng nhập thành công:", auth);
      const username = auth?.user?.username || "guest";
      localStorage.setItem("pi_user", JSON.stringify(auth));
      localStorage.setItem("titi_is_logged_in", "true");
      localStorage.setItem("titi_username", username);

      setStatus(`🎉 Xin chào ${username}!`);
      alert(`🎉 Đăng nhập thành công: ${username}`);
    } catch (err: any) {
      console.error("❌ Lỗi đăng nhập:", err);
      setStatus("❌ Lỗi đăng nhập: " + (err?.message || "không xác định"));
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen text-center p-6">
      <h1 className="text-2xl font-bold text-orange-600 mb-4">
        🔐 Đăng nhập bằng Pi Network
      </h1>
      <p className="mb-6 text-gray-700">{status}</p>

      {piReady && (
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
