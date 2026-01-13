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
  role: "customer" | "seller" | "admin";
};

type AuthContextType = {
  user: PiUser | null;
  piToken: string | null;
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
  piToken: null,
  loading: true,
  piReady: false,
  pilogin: async () => {},
  logout: async () => {},
});

/* =========================
   AUTH PROVIDER
========================= */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PiUser | null>(null);
  const [piToken, setPiToken] = useState<string | null>(null);
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
     LOAD ME (AUTH-CENTRIC)
  ------------------------- */
  async function loadMe(token?: string): Promise<PiUser | null> {
    try {
      const res = await fetch("/api/users/me", {
        headers: token
          ? { Authorization: `Bearer ${token}` }
          : {},
        credentials: "include",
        cache: "no-store",
      });

      if (!res.ok) return null;

      const data = await res.json();
      return data.user as PiUser;
    } catch {
      return null;
    }
  }

  /* -------------------------
     LOAD SESSION (COOKIE)
     → chạy 1 lần khi app mount
  ------------------------- */
  useEffect(() => {
    const loadSession = async () => {
      try {
        const me = await loadMe();
        setUser(me);
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, []);

  /* -------------------------
     LOGIN WITH PI
  ------------------------- */
  const pilogin = async () => {
    if (!window.Pi) {
      alert("⚠️ Vui lòng mở ứng dụng trong Pi Browser");
      return;
    }

    try {
      let token: string | undefined;

      // retry lấy token
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

      setPiToken(token);

      // verify + set cookie
      const verify = await fetch("/api/pi/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: token }),
        credentials: "include",
      });

      const data = await verify.json();

      if (!data.success) {
        alert("❌ Đăng nhập thất bại");
        return;
      }

      // 🔑 LẤY USER CHUẨN (CÓ ROLE)
      const me = await loadMe(token);
      if (me) setUser(me);
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
      setPiToken(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        piToken,
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
