"use client";

import { useEffect } from "react";

export default function LoginWithPi() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.Pi) {
      console.warn("⚠️ Pi SDK chưa sẵn sàng — hãy mở bằng Pi Browser.");
      return;
    }

    window.Pi.init({ version: "2.0" });

    const authenticate = async () => {
      try {
        const scopes = ["username", "payments"];
        const authResult = await window.Pi.authenticate(
          scopes,
          (payment: any) => console.log("⚠️ Incomplete payment:", payment)
        );

        if (authResult?.user?.username) {
          const info = {
            username: authResult.user.username,
            uid: authResult.user.uid,
          };
          localStorage.setItem("user_info", JSON.stringify(info));
          console.log("✅ Đã đăng nhập với Pi:", info.username);

          // ✅ Gửi event thông báo cho toàn app biết user đã thay đổi
          window.dispatchEvent(new Event("pi-user-updated"));
        }
      } catch (err) {
        console.error("❌ Lỗi Pi login:", err);
      }
    };

    const current = localStorage.getItem("user_info");
    if (!current) {
      authenticate();
    } else {
      console.log("👤 Đã có thông tin:", JSON.parse(current).username);
      window.dispatchEvent(new Event("pi-user-updated"));
    }
  }, []);

  return null;
}
