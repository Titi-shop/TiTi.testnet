"use client";
import { createContext, useContext, useState, useEffect } from "react";

interface PiUser {
  username: string;
  uid?: string;
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

  // ✅ Kiểm tra SDK
  useEffect(() => {
    const timer = setInterval(() => {
      if (typeof window !== "undefined" && window.Pi) {
        setPiReady(true);
        clearInterval(timer);
      }
    }, 500);
    return () => clearInterval(timer);
  }, []);

  // ✅ Load user từ localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("pi_user");
      if (saved) {
        const parsed = JSON.parse(saved);
        const username = parsed?.user?.username || parsed?.username || null;
        const accessToken = parsed?.accessToken || "";
        if (username && accessToken) {
          setUser({ username, accessToken });
        }
      }
    } catch (err) {
      console.error("❌ Lỗi đọc pi_user:", err);
    }
  }, []);

  // ✅ Hàm login
  const login = async () => {
    if (!window.Pi) {
      alert("⚠️ Vui lòng mở trong Pi Browser");
      return;
    }

    try {
      const scopes = ["username", "payments"];
      const auth = await window.Pi.authenticate(scopes, (payment) => {
        console.log("⚠️ Payment chưa hoàn tất:", payment);
      });

      const username = auth?.user?.username || "guest";
      const accessToken = auth?.accessToken || "";

      const piUser: PiUser = { username, accessToken };
      setUser(piUser);
      localStorage.setItem("pi_user", JSON.stringify(auth)); // ✅ giữ cấu trúc gốc của Pi SDK

      alert(`🎉 Xin chào ${username}`);
    } catch (err) {
      console.error("❌ Lỗi đăng nhập:", err);
      alert("Lỗi đăng nhập Pi Network");
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("pi_user");
  };

  return (
    <AuthContext.Provider value={{ user, piReady, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
