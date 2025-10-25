"use client";

import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext<any>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [piReady, setPiReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkPi = () => {
      if (window.Pi) {
        console.log("✅ Pi SDK ready:", window.Pi);
        try {
          window.Pi.init({ version: "2.0" }); // 🔥 KHÔNG DÙNG sandbox
          setPiReady(true);
        } catch (e) {
          console.error("❌ Pi.init error:", e);
        }
      } else {
        console.warn("⚠️ Pi SDK chưa sẵn sàng, thử lại...");
        setTimeout(checkPi, 1000);
      }
    };

    checkPi();

    const savedUser = localStorage.getItem("pi_user");
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  const piLogin = async () => {
    if (!window.Pi) {
      alert("⚠️ Hãy mở trang này bằng Pi Browser.");
      return;
    }

    try {
      const scopes = ["username", "payments", "wallet_address"];
      const auth = await window.Pi.authenticate(scopes, (payment: any) => {
        console.log("💸 Payment callback:", payment);
      });

      console.log("✅ Pi auth result:", auth);

      const piUser = {
        username: auth.user.username,
        wallet: auth.user.wallet_address,
        accessToken: auth.accessToken,
      };

      setUser(piUser);
      localStorage.setItem("pi_user", JSON.stringify(piUser));
      console.log("✅ Đăng nhập Pi thành công:", piUser);
    } catch (err: any) {
      console.error("❌ Lỗi đăng nhập Pi:", err);
      alert("Đăng nhập Pi thất bại: " + err.message);
    }
  };

  const logout = () => {
    localStorage.removeItem("pi_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, piReady, piLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
