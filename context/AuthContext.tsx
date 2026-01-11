"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

/* =========================
   TYPES
========================= */
export type PiUser = {
  uid: string;
  username: string;
  wallet_address?: string | null;
};

type AuthContextType = {
  user: PiUser | null;
  loading: boolean;
  piReady: boolean;
  pilogin: () => Promise<void>;
  logout: () => Promise<void>;
};

type PiAuthResult = {
  accessToken?: string;
};

declare global {
  interface Window {
    __pi_inited?: boolean;
    Pi?: {
      init: (options: { version: string; sandbox: boolean }) => void;
      authenticate: (scopes: string[]) => Promise<PiAuthResult>;
    };
  }
}

/* =========================
   CONTEXT
========================= */
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  piReady: false,
  pilogin: async () => {},
  logout: async () => {},
});

/* =========================
   PROVIDER
========================= */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PiUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [piReady, setPiReady] = useState(false);

  /* -------------------------
     INIT PI SDK (1 LẦN)
  ------------------------- */
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.Pi &&
      !window.__pi_inited
    ) {
      window.Pi.init({
        version: "2.0",
        sandbox: process.env.NEXT_PUBLIC_PI_ENV === "testnet",
      });
      window.__pi_inited = true;
    }

    const timer = setInterval(() => {
      if (window.Pi) {
        setPiReady(true);
        clearInterval(timer);
      }
    }, 300);

    return () => clearInterval(timer);
  }, []);

  /* -------------------------
     LOAD SESSION (COOKIE)
  ------------------------- */
  useEffect(() => {
    const loadSession = async () => {
      try {
        const res = await fetch("/api/pi/verify", {
          credentials: "include",
        });
        const data: { success: boolean; user?: PiUser } =
          await res.json();

        setUser(data.success ? data.user ?? null : null);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, []);

  /* -------------------------
     LOGIN
  ------------------------- */
  const pilogin = async () => {
    if (!window.Pi) {
      alert("⚠️ Vui lòng mở ứng dụng trong Pi Browser");
      return;
    }

    try {
      let token: string | undefined;

      for (let i = 0; i < 3; i++) {
        const res = await window.Pi.authenticate(["username"]);
        if (res?.accessToken) {
          token = res.accessToken;
          break;
        }
        await new Promise((r) => setTimeout(r, 400));
      }

      if (!token) {
        alert("❌ Không lấy được accessToken từ Pi");
        return;
      }

      const verify = await fetch("/api/pi/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: token }),
        credentials: "include",
      });

      const data: { success: boolean; user?: PiUser } =
        await verify.json();

      if (data.success && data.user) {
        setUser(data.user);
      } else {
        alert("❌ Đăng nhập thất bại");
      }
    } catch (err) {
      console.error("❌ Pi login error:", err);
      alert("❌ Có lỗi khi đăng nhập");
    }
  };

  /* -------------------------
     LOGOUT
  ------------------------- */
  const logout = async () => {
    try {
      await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        piReady,
        pilogin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/* =========================
   HOOK
========================= */
export const useAuth = () => useContext(AuthContext);
