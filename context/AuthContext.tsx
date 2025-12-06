"use client";

import { createContext, useContext, useState, useEffect } from "react";

// =============================================
// TYPES
// =============================================

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
  logout: () => Promise<void>;
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

// =============================================
// CONTEXT
// =============================================

const AuthContext = createContext<AuthContextType>({
  user: null,
  piReady: false,
  loading: true,
  pilogin: async () => {},
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<PiUser | null>(null);
  const [piReady, setPiReady] = useState(false);
  const [loading, setLoading] = useState(true);

  // =============================================
  // INIT PI SDK
  // =============================================
  useEffect(() => {
    if (typeof window !== "undefined" && window.Pi && !window.__pi_inited) {
      window.Pi.init({
        version: "2.0",
        sandbox: process.env.NEXT_PUBLIC_PI_ENV === "testnet",
      });
      window.__pi_inited = true;
    }

    // Check PI SDK ready
    if (typeof window !== "undefined" && window.Pi?.onReady) {
      window.Pi.onReady(() => setPiReady(true));
    } else {
      // fallback polling
      const timer = setInterval(() => {
        if (typeof window !== "undefined" && window.Pi) {
          setPiReady(true);
          clearInterval(timer);
        }
      }, 300);
    }
  }, []);

  // =============================================
  // FETCH USER SESSION FROM SERVER
  // =============================================
  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await fetch("/api/pi/verify", {
          method: "GET",
          credentials: "include", // 🔥 Quan trọng
        });

        const data: { success: boolean; user: PiUser | null } = await res.json();

        if (data.success && data.user) setUser(data.user);
        else setUser(null);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // =============================================
  // LOGIN WITH PI BROWSER
  // =============================================
  const pilogin = async () => {
    if (typeof window === "undefined" || !window.Pi) {
      alert("⚠️ Vui lòng mở trong Pi Browser!");
      return;
    }

    try {
      const scopes = ["username"];
      const result = await window.Pi.authenticate(scopes);

      if (!result.accessToken) {
        throw new Error("Không nhận được accessToken từ Pi Browser");
      }

      // gửi thẳng token lên server để server verify + tạo session HMAC
      const res = await fetch("/api/pi/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: result.accessToken }),
        credentials: "include", // 🔥 BẮT BUỘC
      });

      const data: { success: boolean; user: PiUser | null } = await res.json();

      if (!data.success || !data.user) {
        throw new Error("Xác thực Pi thất bại");
      }

      setUser(data.user);
    } catch (err) {
      console.error("❌ pilogin error:", err);
      alert("❌ Đăng nhập thất bại, vui lòng thử lại.");
    }
  };

  // =============================================
  // LOGOUT
  // =============================================
  const logout = async () => {
    try {
      await fetch("/api/pi/verify", {
        method: "DELETE",
        credentials: "include",
      });
    } catch (err) {
      console.error("❌ logout error:", err);
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        piReady,
        loading,
        pilogin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
