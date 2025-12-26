"use client";

import { createContext, useContext, useState, useEffect } from "react";

/* =========================
   TYPES
========================= */

export interface PiUser {
  username: string;
  uid: string;
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
  accessToken?: string;
  user?: { username: string; uid?: string };
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

/* =========================
   CONTEXT
========================= */

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

  /* =========================
     INIT PI SDK
  ========================= */
  useEffect(() => {
    if (typeof window === "undefined" || !window.Pi) return;

    if (!window.__pi_inited) {
      window.Pi.init({
        version: "2.0",
        sandbox: process.env.NEXT_PUBLIC_PI_ENV === "testnet",
      });
      window.__pi_inited = true;
    }

    // ✅ Chuẩn: dùng onReady nếu có
    if (window.Pi.onReady) {
      window.Pi.onReady(() => {
        setPiReady(true);
      });
    } else {
      // fallback
      setPiReady(true);
    }
  }, []);

  /* =========================
     LOAD SESSION (COOKIE)
  ========================= */
  useEffect(() => {
    let mounted = true;

    const loadSession = async () => {
      try {
        const res = await fetch("/api/pi/verify", {
          credentials: "include",
        });

        if (!res.ok) {
          if (mounted) setUser(null);
          return;
        }

        const data = await res.json();
        if (mounted) setUser(data.success ? data.user : null);
      } catch (err) {
        console.warn("⚠️ loadSession error:", err);
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadSession();

    return () => {
      mounted = false;
    };
  }, []);

  /* =========================
     LOGIN
  ========================= */
  const pilogin = async () => {
    if (!window.Pi) {
      alert("⚠️ Vui lòng mở trong Pi Browser!");
      return;
    }

    try {
      const scopes = ["username"];
      let result: PiAuthResult | null = null;

      for (let i = 0; i < 3; i++) {
        result = await window.Pi.authenticate(scopes);
        if (result?.accessToken) break;
        await new Promise((r) => setTimeout(r, 400));
      }

      if (!result?.accessToken) {
        alert("⚠️ Không lấy được accessToken từ Pi");
        return;
      }

      const res = await fetch("/api/pi/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: result.accessToken }),
        credentials: "include",
      });

      const data = await res.json();

      if (data.success && data.user) {
        setUser(data.user);
      } else {
        alert("❌ Đăng nhập thất bại");
      }
    } catch (err) {
      console.error("❌ Login error:", err);
      alert("❌ Có lỗi khi đăng nhập");
    }
  };

  /* =========================
     LOGOUT
  ========================= */
  const logout = async () => {
    try {
      await fetch("/api/pi/verify", {
        method: "DELETE",
        credentials: "include",
      });

      // ✅ logout Pi SDK nếu có
      window.Pi?.logout?.();
      setUser(null);
    } catch (err) {
      console.error("❌ logout error:", err);
    }
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
