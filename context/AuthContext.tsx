"use client";

import { createContext, useContext, useState, useEffect } from "react";

// =============================================
// TYPES
// =============================================

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
  // INIT PI SDK — INIT 1 LẦN, POLLING
  // =============================================
  useEffect(() => {
    if (typeof window === "undefined") return;

    const tryInitPi = () => {
      if (!window.Pi) return false;

      if (!window.__pi_inited) {
        try {
          window.Pi.init({
            version: "2.0",
            sandbox: true, // Testnet
          });
          window.__pi_inited = true;
          console.log("✅ Pi SDK initialized");
        } catch (e) {
          console.error("❌ Pi init error:", e);
        }
      }

      setPiReady(true);

      if (window.Pi.onReady) {
        window.Pi.onReady(() => {
          console.log("✅ Pi SDK ready (onReady)");
          setPiReady(true);
        });
      }

      return true;
    };

    if (tryInitPi()) return;

    const timer = setInterval(() => {
      if (tryInitPi()) clearInterval(timer);
    }, 300);

    return () => clearInterval(timer);
  }, []);

  // =============================================
  // LOAD USER SESSION FROM COOKIE
  // =============================================
  useEffect(() => {
    const loadSession = async () => {
      try {
        const res = await fetch("/api/pi/verify", { credentials: "include" });
        const data = await res.json();
        setUser(data.success ? data.user : null);
      } catch {
        setUser(null);
      }
      setLoading(false);
    };

    loadSession();
  }, []);

  // =============================================
  // LOGIN — FIXED VERSION (LOAD SESSION SAU POST)
  // =============================================
  const pilogin = async () => {
    if (!window.Pi) {
      alert("⚠️ Vui lòng mở ứng dụng bằng Pi Browser!");
      return;
    }

    try {
      const scopes = ["username"];
      let result: PiAuthResult | null = null;

      for (let i = 0; i < 3; i++) {
        result = await window.Pi.authenticate(scopes);
        console.log("🔥 AUTH RESULT:", result);
        if (result?.accessToken) break;
        await new Promise((r) => setTimeout(r, 400));
      }

      if (!result?.accessToken) {
        alert("⚠️ Không nhận được accessToken từ Pi Browser.");
        return;
      }

      // Gửi token lên server
      await fetch("/api/pi/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ accessToken: result.accessToken }),
      });

      // ⭐ BẮT BUỘC: Load lại cookie session (FIX LOGIN BỊ KẸT)
      const session = await fetch("/api/pi/verify", {
        credentials: "include",
      }).then((r) => r.json());

      console.log("🔥 SESSION RESULT:", session);

      if (session.success && session.user) {
        setUser(session.user);
      } else {
        alert("❌ Đăng nhập thất bại.");
      }
    } catch (err) {
      console.error("❌ Login error:", err);
      alert("❌ Lỗi đăng nhập.");
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
      setUser(null);
    } catch (err) {
      console.error("❌ Logout error:", err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, piReady, loading, pilogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
