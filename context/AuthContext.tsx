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
        try {
          window.Pi.init({ version: "2.0" });
          setPiReady(true);
        } catch (e) {
          console.error("❌ Pi.init error:", e);
        }
      } else {
        setTimeout(checkPi, 1000);
      }
    };

    checkPi();

    const saved = localStorage.getItem("pi_user");
    if (saved) setUser(JSON.parse(saved));
  }, []);

  const piLogin = async () => {
    if (!window.Pi) {
      alert("⚠️ Vui lòng mở bằng Pi Browser");
      return;
    }
    try {
      const scopes = ["username", "payments", "wallet_address"];
      const auth = await window.Pi.authenticate(scopes, (p: any) =>
        console.log("💸 Payment callback:", p)
      );
      const piUser = {
        uid: auth.user.uid,
        username: auth.user.username,
        walletAddress: auth.user.wallet_address,
        accessToken: auth.accessToken,
      };
      localStorage.setItem("pi_user", JSON.stringify(piUser));
      setUser(piUser);
      alert(`🎉 Xin chào ${piUser.username}`);
    } catch (err: any) {
      alert("❌ Đăng nhập lỗi: " + err.message);
      console.error(err);
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
