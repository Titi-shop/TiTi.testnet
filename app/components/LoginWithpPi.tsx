"use client";

import { useEffect } from "react";

export default function LoginWithPi() {
  useEffect(() => {
    // 🟢 Nếu đã có user_info thì bỏ qua
    const info = localStorage.getItem("user_info");
    if (info) return;

    // 🟡 Nếu có SDK của Pi (trên Pi Browser)
    if (typeof window !== "undefined" && window.Pi) {
      const login = async () => {
        try {
          const scopes = ["username"];
          const authResult = await window.Pi.authenticate(scopes, () => {});
          if (authResult?.user?.username) {
            const username = authResult.user.username;
            localStorage.setItem("user_info", JSON.stringify({ username }));
            console.log("✅ Pi user:", username);
          }
        } catch (err) {
          console.error("❌ Lỗi đăng nhập Pi:", err);
        }
      };
      login();
    } else {
      console.warn("⚠️ Không phát hiện Pi SDK — chỉ chạy trên Pi Browser.");
    }
  }, []);

  return null;
}
