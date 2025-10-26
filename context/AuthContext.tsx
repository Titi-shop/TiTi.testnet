"use client";
import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext<any>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [piReady, setPiReady] = useState(false);

  // ✅ Chờ Pi SDK load hoàn toàn trước khi init
  useEffect(() => {
    if (typeof window === "undefined") return;

    const waitForPi = () =>
      new Promise<void>((resolve, reject) => {
        let tries = 0;
        const check = setInterval(() => {
          if (window.Pi) {
            clearInterval(check);
            resolve();
          } else if (tries++ > 20) {
            clearInterval(check);
            reject("❌ Pi SDK không tải được");
          }
        }, 300);
      });

    const initPi = async () => {
      try {
        await waitForPi();
        console.log("✅ Pi SDK detected, initializing...");

        const isTestnet = process.env.NEXT_PUBLIC_PI_ENV === "testnet";
        window.Pi.init({ version: "2.0", sandbox: isTestnet });

        console.log(`✅ Pi SDK initialized (${isTestnet ? "TESTNET" : "MAINNET"})`);
        setPiReady(true);
      } catch (err) {
        console.error("❌ Lỗi khởi tạo Pi SDK:", err);
      }
    };

    initPi();

    // ✅ Nạp user nếu có sẵn trong localStorage
    const saved = localStorage.getItem("pi_user");
    if (saved) setUser(JSON.parse(saved));
  }, []);

  // ✅ Hàm đăng nhập Pi
  const piLogin = async () => {
    if (!window.Pi) {
      alert("⚠️ Hãy mở trang này bằng Pi Browser");
      return;
    }

    try {
      const scopes = ["username", "payments", "wallet_address"];

      const auth = await window.Pi.authenticate(scopes, (payment: any) => {
        console.log("💸 Payment callback:", payment);
      });

      const piUser = {
        uid: auth.user.uid,
        username: auth.user.username,
        walletAddress: auth.user.wallet_address,
        accessToken: auth.accessToken,
      };

      localStorage.setItem("pi_user", JSON.stringify(piUser));
      setUser(piUser);

      alert(`🎉 Xin chào ${piUser.username}`);
      console.log("✅ Pi user logged in:", piUser);
    } catch (err: any) {
      console.error("❌ Đăng nhập lỗi:", err);
      alert("❌ Đăng nhập thất bại: " + (err.message || "Lỗi không xác định"));
    }
  };

  // ✅ Hàm đăng xuất
  const logout = () => {
    localStorage.removeItem("pi_user");
    setUser(null);
    alert("👋 Bạn đã đăng xuất!");
  };

  return (
    <AuthContext.Provider value={{ user, piReady, piLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
