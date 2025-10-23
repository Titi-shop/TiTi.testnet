"use client";

import { useEffect, useState } from "react";

/**
 * 🟣 LoginWithPi.tsx
 * Component đăng nhập bằng Pi Network (dùng trong Pi Browser)
 * - Gọi Pi SDK để đăng nhập
 * - Gửi accessToken sang server (/api/pi/verify) để xác minh thật
 * - Lưu thông tin người dùng vào localStorage để các trang khác dùng
 */

export default function LoginWithPi() {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Ngăn chạy ngoài Pi Browser
    if (typeof window === "undefined") return;

    if (!window.Pi) {
      console.warn("⚠️ Pi SDK chưa sẵn sàng — hãy mở trang này trong Pi Browser.");
      return;
    }

    // ✅ Khởi tạo Pi SDK
    window.Pi.init({ version: "2.0", sandbox: false });

    // 🔹 Hàm thực hiện đăng nhập
    const authenticate = async () => {
      setLoading(true);
      try {
        const scopes = ["username", "payments"];
        const authResult = await window.Pi.authenticate(
          scopes,
          (payment: any) => console.log("⚠️ Incomplete payment:", payment)
        );

        console.log("✅ Pi auth result:", authResult);

        if (!authResult?.accessToken) {
          alert("Không lấy được accessToken từ Pi Network.");
          setLoading(false);
          return;
        }

        // 🔹 Gửi accessToken lên server để xác minh thật với Pi Network
        const verifyRes = await fetch("/api/pi/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accessToken: authResult.accessToken }),
        });

        const verifyData = await verifyRes.json();
        console.log("🔍 Pi verify result:", verifyData);

        if (verifyData?.success) {
          const user = verifyData.user;
          localStorage.setItem("pi_user", JSON.stringify(user));
          localStorage.setItem("titi_is_logged_in", "true");
          localStorage.setItem("titi_username", user.username);
          console.log("✅ Đăng nhập & xác minh thành công:", user);
          window.dispatchEvent(new Event("pi-user-updated"));
        } else {
          alert("⚠️ Xác minh Pi Network thất bại: " + (verifyData.message || ""));
        }
      } catch (err: any) {
        console.error("❌ Lỗi đăng nhập Pi:", err);
        alert("❌ Lỗi đăng nhập Pi Network: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    // 🔹 Nếu chưa có thông tin đăng nhập thì tiến hành xác thực
    const current = localStorage.getItem("pi_user");
    if (!current) {
      authenticate();
    } else {
      const user = JSON.parse(current);
      console.log("👤 Đã có user:", user.username);
      window.dispatchEvent(new Event("pi-user-updated"));
    }
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-6">
      {loading ? (
        <p className="text-gray-500 mt-4">⏳ Đang xác minh với Pi Network...</p>
      ) : (
        <p className="text-gray-600 mt-2 text-sm text-center">
          🚀 Hệ thống đang xác minh Pi Network...
          <br />
          (Nếu chưa thấy gì, hãy đảm bảo bạn đang mở trong Pi Browser.)
        </p>
      )}
    </div>
  );
}
