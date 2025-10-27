"use client";
import { createContext, useContext, useEffect, useState } from "react";

declare global {
  interface Window {
    Pi?: any;
    __pi_initialized?: boolean;
  }
}

type AuthCtx = {
  user: null | { uid: string; username: string; walletAddress?: string; accessToken?: string };
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
  const [user, setUser] = useState<AuthCtx["user"]>(null);
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
          } else if (tries++ > 40) {
            clearInterval(id);
            reject(new Error("Pi SDK chưa tải được"));
          }
        }, 200);
      });

    const bootstrap = async () => {
      try {
        await waitForPi();

        // Init đúng môi trường, chỉ 1 lần trong toàn app
        if (!window.__pi_initialized) {
          const isTestnet = process.env.NEXT_PUBLIC_PI_ENV === "testnet";
          window.Pi.init({ version: "2.0", sandbox: isTestnet });
          window.__pi_initialized = true;
          console.log(`✅ Pi.init done (${isTestnet ? "TESTNET" : "MAINNET"})`);
        }

        setPiReady(true);
      } catch (err) {
        console.error("❌ Pi init error:", err);
        setPiReady(false);
      }

      // load user đã lưu
      try {
        const saved = localStorage.getItem("pi_user");
        if (saved) setUser(JSON.parse(saved));
      } catch {}
    };

    bootstrap();
  }, []);

  const piLogin = async () => {
    if (!window.Pi) {
      alert("⚠️ Hãy mở trong Pi Browser.");
      return;
    }
    try {
      const scopes = ["username", "payments", "wallet_address"];
      const auth = await window.Pi.authenticate(scopes, (p: any) =>
        console.log("💸 Incomplete payment:", p)
      );

      const piUser = {
        uid: auth.user.uid,
        username: auth.user.username,
        walletAddress: auth.user.wallet_address,
        accessToken: auth.accessToken,
      };

      localStorage.setItem("pi_user", JSON.stringify(piUser));
      localStorage.setItem("titi_is_logged_in", "true");
      localStorage.setItem("titi_username", piUser.username);
      setUser(piUser);
      alert(`🎉 Xin chào ${piUser.username}`);
    } catch (err: any) {
      console.error("❌ Đăng nhập lỗi:", err);
      alert("❌ Đăng nhập lỗi: " + (err?.message || "không xác định"));
    }
  };

  const logout = () => {
    localStorage.removeItem("pi_user");
    localStorage.removeItem("titi_is_logged_in");
    localStorage.removeItem("titi_username");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, piReady, piLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
