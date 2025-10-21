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
            pi_uid: authResult.user.uid,
            pi_username: authResult.user.username,
            wallet: authResult.user.wallet?.address || "",
          };
          localStorage.setItem("pi_account", JSON.stringify(info));
          console.log("✅ Đăng nhập Pi thành công:", info.pi_username);

          // thông báo toàn app rằng user đã đăng nhập
          window.dispatchEvent(new Event("pi-user-updated"));
        }
      } catch (err) {
        console.error("❌ Lỗi đăng nhập Pi:", err);
      }
    };

    const existing = localStorage.getItem("pi_account");
    if (!existing) {
      authenticate();
    } else {
      const user = JSON.parse(existing);
      console.log("👤 Đã có tài khoản Pi:", user.pi_username);
      window.dispatchEvent(new Event("pi-user-updated"));
    }
  }, []);

  return null;
}
