"use client";

import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext<any>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [piReady, setPiReady] = useState(false);

  // ✅ Kiểm tra Pi SDK khi load
  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkPi = () => {
      if (window.Pi) {
        console.log("✅ Pi SDK detected:", window.Pi);
        // ⚙️ Khởi tạo thật (không sandbox)
        window.Pi.init({ version: "2.0", sandbox: false });
        setPiReady(true);
      } else {
        console.warn("⚠️ Pi SDK chưa sẵn sàng — mở trong Pi Browser.");
        setPiReady(false);
      }
    };

    // Thử khởi tạo sau 1s nếu SDK load chậm
    setTimeout(checkPi, 1000);
  }, []);

  // 🔹 Tự động khôi phục user từ localStorage
  useEffect(() => {
    const saved = localStorage.getItem("pi_user");
    if (saved) {
      setUser(JSON.parse(saved));
      console.log("👤 Khôi phục user:", JSON.parse(saved));
    }
  }, []);

  // ✅ Đăng nhập bằng Pi SDK thật
  const piLogin = async () => {
    try {
      if (!window.Pi) {
        alert("⚠️ Pi SDK chưa load. Hãy mở trong Pi Browser.");
        return;
      }

      const scopes = ["username", "payments", "wallet_address"];
      const auth = await window.Pi.authenticate(scopes, (payment: any) =>
        console.log("💰 Pi Payment callback:", payment)
      );

      if (!auth?.accessToken) {
        alert("❌ Không lấy được accessToken từ Pi Network.");
        return;
      }

      console.log("✅ Pi Auth Result:", auth);

      // Gửi token sang server xác minh thật
      const res = await fetch("/api/pi/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: auth.accessToken }),
      });

      const data = await res.json();
      if (!data.success) {
        alert("❌ Xác minh thất bại: " + data.message);
        return;
      }

      const verifiedUser = {
        ...data.user,
        wallet: auth.user.wallet_address,
        accessToken: auth.accessToken,
      };

      localStorage.setItem("pi_user", JSON.stringify(verifiedUser));
      setUser(verifiedUser);
      console.log("🎉 Đăng nhập Pi thành công:", verifiedUser);
      alert("✅ Đăng nhập thành công!");
    } catch (err: any) {
      console.error("💥 Lỗi đăng nhập Pi:", err);
      alert("❌ Đăng nhập Pi thất bại: " + err.message);
    }
  };

  // ✅ Đăng xuất
  const logout = () => {
    localStorage.removeItem("pi_user");
    setUser(null);
    console.log("🚪 Đăng xuất thành công");
  };

  return (
    <AuthContext.Provider value={{ user, piReady, piLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
