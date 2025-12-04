"use client";

import { createContext, useContext, useState, useEffect } from "react";

export interface PiUser {
  username: string;
  uid?: string;
  wallet_address?: string | null;
  roles: string[];
  created_at: string;
}

interface AuthContextType {
  user: PiUser | null;
  piReady: boolean;
  loading: boolean;
  pilogin: () => Promise<void>;
  logout: () => void;
}

interface PiAuthResult {
  user?: {
    username: string;
    uid?: string;
  };
  accessToken?: string;
}

declare global {
  interface Window {
    __pi_inited?: boolean;
    Pi?: {
      init: (options: { version: string; sandbox: boolean }) => void;
      onReady?: (callback: () => void) => void;
      authenticate: (scopes: string[]) => Promise<PiAuthResult>;
      logout?: () => void;
    };
  }
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

  // Khởi tạo Pi SDK
  useEffect(() => {
    if (typeof window !== "undefined" && window.Pi) {
      if (!window.__pi_inited) {
       window.Pi.init({ version: "2.0", sandbox: false });
        window.__pi_inited = true;
      }
    }

    if (typeof window !== "undefined" && window.Pi?.onReady) {
      window.Pi.onReady(() => {
        setPiReady(true);
      });
    } else {
      const timer = setInterval(() => {
        if (typeof window !== "undefined" && window.Pi) {
          setPiReady(true);
          clearInterval(timer);
        }
      }, 400);
    }
  }, []);

  // Lấy user từ server (session cookie)
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/pi/verify", {
          method: "GET",
          credentials: "include",
        });
        const data: { success: boolean; user?: PiUser } = await res.json();
        if (data.success && data.user) setUser(data.user);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  // Login Pi
  const pilogin = async () => {
  if (typeof window === "undefined" || !window.Pi) {
    alert("⚠️ Vui lòng mở trong Pi Browser!");
    return;
  }

  if (!piReady) {
    alert("⚠️ Pi SDK chưa sẵn sàng, vui lòng thử lại.");
    return;
  }

  try {
    const scopes = ["username"];
    const authResult: PiAuthResult = await window.Pi.authenticate(scopes);

      if (!authResult?.accessToken) throw new Error("Không nhận được accessToken");

      const res = await fetch("/api/pi/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: authResult.accessToken }),
        credentials: "include",
      });

      const data: { success: boolean; user?: PiUser } = await res.json();
      if (!data.success || !data.user) throw new Error("Login thất bại");

      setUser(data.user);
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error("❌ pilogin error:", err.message);
        alert(`❌ Đăng nhập thất bại: ${err.message}`);
      } else {
        console.error("❌ Unknown login error", err);
        alert("❌ Đăng nhập thất bại");
      }
    }
  };

  // Logout
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
