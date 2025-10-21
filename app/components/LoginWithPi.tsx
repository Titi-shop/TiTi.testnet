"use client";
import { useEffect } from "react";

export default function LoginWithPi() {
  useEffect(() => {
    const login = async () => {
      // ⚙️ Nếu đã có user_info thì không cần login lại
      const existing = localStorage.getItem("user_info");
      if (existing) {
        console.log("👤 Đã đăng nhập:", JSON.parse(existing));
        return;
      }

      // ⚙️ Nếu Pi SDK sẵn sàng
      if (typeof window !== "undefined" && window.Pi) {
        try {
          const scopes = ["username"];
          const authResult = await window.Pi.authenticate(scopes, () => {});
          if (authResult?.user?.username) {
            const username = authResult.user.username;
            localStorage.setItem("user_info", JSON.stringify({ username }));
            console.log("✅ Đăng nhập Pi thành công:", username);
          }
        } catch (err) {
          console.error("❌ Lỗi đăng nhập Pi:", err);
        }
      } else {
        console.warn("⚠️ Không phát hiện Pi SDK — chỉ chạy trong Pi Browser.");
      }
    };

    login();
  }, []);

  return null;
}
