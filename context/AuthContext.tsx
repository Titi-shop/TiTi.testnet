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

  const waitForPi = () =>
    new Promise<void>((resolve, reject) => {
      let tries = 0;
      const id = setInterval(() => {
        if (window.Pi) {
          clearInterval(id);
          resolve();
        } else if (tries++ > 30) {
          clearInterval(id);
          reject(new Error("Pi SDK chưa tải được"));
        }
      }, 300);
    });

  const initPi = async () => {
    try {
      await waitForPi();
      console.log("ℹ️ Pi SDK ready (init done by PiProvider)");
      setPiReady(true);
    } catch (err) {
      console.error("❌ Pi SDK init error:", err);
      setPiReady(false);
    }

    try {
      const saved = localStorage.getItem("pi_user");
      if (saved) setUser(JSON.parse(saved));
    } catch (e) {
      console.warn("⚠️ Không thể load user:", e);
    }
  };

  initPi();
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

      // ✅ Lưu thông tin người dùng
      localStorage.setItem("pi_user", JSON.stringify(piUser));
      localStorage.setItem("titi_is_logged_in", "true");
      localStorage.setItem("titi_username", piUser.username);
      setUser(piUser);

      alert(`🎉 Xin chào ${piUser.username}`);
      console.log("✅ Đăng nhập thành công:", piUser);
    } catch (err: any) {
      console.error("❌ Lỗi đăng nhập:", err);
      alert("❌ Lỗi đăng nhập: " + (err?.message || "Không xác định"));
    }
  };

  const logout = () => {
    localStorage.removeItem("pi_user");
    localStorage.removeItem("titi_is_logged_in");
    localStorage.removeItem("titi_username");
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
