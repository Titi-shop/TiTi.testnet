"use client";
import { useEffect, useState } from "react";

export default function PiLoginTest() {
  const [status, setStatus] = useState("Đang khởi tạo...");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const init = async () => {
      try {
        await new Promise((r) => setTimeout(r, 1000)); // đợi SDK load
        if (!window.Pi) {
          setStatus("⚠️ Pi SDK chưa load. Hãy mở bằng Pi Browser.");
          return;
        }

        window.Pi.init({ version: "2.0", sandbox: true });
        setStatus("✅ Pi SDK đã khởi tạo!");

        const scopes = ["username", "payments", "wallet_address"];
        const auth = await window.Pi.authenticate(scopes, (payment) => {
          console.log("Payment in progress:", payment);
        });

        console.log("✅ Auth thành công:", auth);
        setStatus(`🎉 Xin chào ${auth.user.username}`);
      } catch (err) {
        console.error("❌ Lỗi Pi login:", err);
        setStatus("❌ Lỗi: " + err.message);
      }
    };

    init();
  }, []);

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <h2>🔐 Kiểm tra đăng nhập Pi</h2>
      <p>{status}</p>
    </div>
  );
}
