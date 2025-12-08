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

    // Pi ready detection
    const checkReady = () => {
      if (window.Pi) {
        setPiReady(true);
        return true;
      }
      return false;
    };

    if (!checkReady()) {
      const timer = setInterval(() => {
        if (checkReady()) clearInterval(timer);
      }, 300);
    }
  }, []);

  // =============================================
  // LOAD USER SESSION (COOKIE SESSION)
  // =============================================
  useEffect(() => {
    const loadSession = async () => {
      try {
        const res = await fetch("/api/pi/verify", {
          credentials: "include",
        });
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
  // LOGIN (Pi Browser)
  // =============================================
  const pilogin = async () => {
    if (!window.Pi) {
      alert("⚠️ Vui lòng mở trong Pi Browser!");
      return;
    }

    try {
      const scopes = ["username"];

      // Retry authentication up to 3 times
      let result: PiAuthResult | null = null;
      for (let i = 0; i < 3; i++) {
        result = await window.Pi.authenticate(scopes);
        if (result?.accessToken) break;
        await new Promise((r) => setTimeout(r, 400));
      }

      if (!result?.accessToken) {
        alert("⚠️ Pi Browser không trả về accessToken. Thử lại.");
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
        alert("❌ Đăng nhập thất bại. Vui lòng thử lại.");
      }
    } catch (err) {
      console.error("❌ Login error:", err);
      alert("❌ Có lỗi xảy ra khi đăng nhập.");
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
