"use client";
import { createContext, useContext, useEffect, useState } from "react";

declare global {
  interface Window {
    Pi?: any;
    __pi_initialized?: boolean;
  }
}

type PiUser = {
  uid: string;
  username: string;
  walletAddress?: string;
  accessToken?: string;
};

type AuthCtx = {
  user: PiUser | null;
  piReady: boolean;
  piLogin: () => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthCtx>({
  user: null,
  piReady: false,
  piLogin: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PiUser | null>(null);
  const [piReady, setPiReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const check = setInterval(() => {
      if (window.Pi && window.__pi_initialized) {
        setPiReady(true);
        clearInterval(check);
      }
    }, 400);

    const saved = localStorage.getItem("pi_user");
    if (saved) setUser(JSON.parse(saved));

    return () => clearInterval(check);
  }, []);

  const piLogin = async () => {
    if (!window.Pi) {
      alert("⚠️ Hãy mở trang này bằng Pi Browser nhé!");
      return;
    }

    try {
      const scopes = ["username", "payments", "wallet_address"];
      const auth = await window.Pi.authenticate(scopes, (payment: any) => {
        console.log("💸 Callback thanh toán:", payment);
      });

      const piUser: PiUser = {
        uid: auth.user.uid,
        username: auth.user.username,
        walletAddress: auth.user.wallet_address,
        accessToken: auth.accessToken,
      };

      localStorage.setItem("pi_user", JSON.stringify(piUser));
      setUser(piUser);
      alert(`🎉 Xin chào ${piUser.username}`);
    } catch (err: any) {
      console.error("❌ Lỗi đăng nhập:", err);
      alert("❌ Lỗi đăng nhập: " + (err?.message || "Không xác định"));
    }
  };

  const logout = () => {
    localStorage.removeItem("pi_user");
    setUser(null);
    alert("🚪 Đã đăng xuất");
  };

  return (
    <AuthContext.Provider value={{ user, piReady, piLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
