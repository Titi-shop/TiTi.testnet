"use client";

import { createContext, useContext, useState, useEffect } from "react";

interface PiUser {
  username: string;
  uid?: string;
}

interface AuthContextType {
  user: PiUser | null;
  piReady: boolean;
  loading: boolean;
  pilogin: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  piReady: false,
  loading: true,
  pilogin: async () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<PiUser | null>(null);
  const [piReady, setPiReady] = useState(false);
  const [loading, setLoading] = useState(true);

  // ✅ Khởi tạo Pi SDK
  useEffect(() => {
    if (typeof window !== "undefined" && window.Pi) {
      if (!(window as any).__pi_inited) {
        window.Pi.init({ version: "2.0", sandbox: true });
        (window as any).__pi_inited = true;
      }
    }

    if (typeof window !== "undefined" && window.Pi?.onReady) {
      window.Pi.onReady(() => {
        setPiReady(true);
      });
    } else {
      // fallback cho Pi SDK không có onReady
      const timer = setInterval(() => {
        if (typeof window !== "undefined" && window.Pi) {
          setPiReady(true);
          clearInterval(timer);
        }
      }, 400);
    }
  }, []);

  // ✅ Khôi phục user từ server (session cookie)
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/pi/verify", {
          method: "GET",
          credentials: "include", // gửi cookie tự động
        });
        const data = await res.json();
        if (data.success && data.user) setUser(data.user);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  // ✅ Login Pi
  const pilogin = async () => {
    if (typeof window === "undefined" || !window.Pi) {
      alert("⚠️ Vui lòng mở trong Pi Browser!");
      return;
    }

    try {
      const scopes = ["username"];
      const authResult = await window.Pi.authenticate(scopes);

      if (!authResult?.accessToken) throw new Error("Không nhận được accessToken");

      // Gửi accessToken lên server để verify và tạo session cookie
      const res = await fetch("/api/pi/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: authResult.accessToken }),
        credentials: "include", // nhận cookie HttpOnly
      });

      const data = await res.json();

      if (!data.success) throw new Error("Login thất bại");

      setUser(data.user);
    } catch (err: any) {
      console.error("❌ pilogin error:", err);
      alert("❌ Đăng nhập thất bại. Vui lòng thử lại.");
    }
  };

  // ✅ Logout: chỉ xóa session cookie từ server
  const logout = async () => {
    try {
      await fetch("/api/pi/verify", {
        method: "DELETE",
        credentials: "include",
      });
    } catch {}
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, piReady, loading, pilogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
