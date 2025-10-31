"use client";
import { createContext, useContext, useState, useEffect } from "react";

interface PiUser {
  username: string;
  uid: string;
  accessToken: string;
}

interface AuthContextType {
  user: PiUser | null;
  piReady: boolean;
  login: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  piReady: false,
  login: async () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<PiUser | null>(null);
  const [piReady, setPiReady] = useState(false);

  // ✅ 1. Theo dõi SDK Pi có sẵn chưa
  useEffect(() => {
    const timer = setInterval(() => {
      if (typeof window !== "undefined" && window.Pi) {
        setPiReady(true);
        clearInterval(timer);
      }
    }, 500);
    return () => clearInterval(timer);
  }, []);

  // ✅ 2. Load user từ localStorage khi mở lại app
  useEffect(() => {
    const saved = localStorage.getItem("pi_user");
    if (saved) setUser(JSON.parse(saved));
  }, []);

  // ✅ 3. Hàm login bằng Pi Network
  const login = async () => {
    try {
      if (!window.Pi) throw new Error("Pi SDK chưa sẵn sàng");

      const scopes = ["username", "payments"];
      const auth = await window.Pi.authenticate(scopes, onIncompletePaymentFound);

      const piUser: PiUser = {
        username: auth.user.username,
        uid: auth.user.uid,
        accessToken: auth.accessToken,
      };

      setUser(piUser);
      localStorage.setItem("pi_user", JSON.stringify(piUser));

      console.log("✅ Đăng nhập thành công:", piUser);
    } catch (err) {
      console.error("❌ Lỗi đăng nhập:", err);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("pi_user");
  };

  const onIncompletePaymentFound = (payment: any) => {
    console.log("⚠️ Incomplete payment:", payment);
  };

  return (
    <AuthContext.Provider value={{ user, piReady, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
