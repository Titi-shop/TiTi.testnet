"use client";

import { createContext, useContext, useState, useEffect } from "react";

interface PiUser {
  username: string;
  uid?: string;
  wallet_address?: string;
  roles?: string[];
}

interface AuthContextType {
  user: PiUser | null;
  loading: boolean;
  piReady: boolean;
  pilogin: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  piReady: false,
  pilogin: async () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<PiUser | null>(null);
  const [piReady, setPiReady] = useState(false);
  const [loading, setLoading] = useState(true);

  /* ====================================================
     🟢 KIỂM TRA SDK PI KHỞI TẠO
  ===================================================== */
  useEffect(() => {
    if (typeof window !== "undefined" && window.Pi) {
      try {
        window.Pi.init({ version: "2.0", sandbox: true });
        setPiReady(true);
      } catch {
        console.error("❌ Lỗi khởi tạo Pi SDK");
      }
    }
  }, []);

  /* ====================================================
     🔁 PHỤC HỒI USER KHI LOAD LẠI TRANG (HTTP-only cookie)
  ===================================================== */
  useEffect(() => {
    const restoreUser = async () => {
      try {
        const res = await fetch("/api/auth/me", { method: "GET" });
        const data = await res.json();
        if (data?.user) setUser(data.user);
      } catch (err) {
        console.warn("⚠ Không thể khôi phục tài khoản");
      } finally {
        setLoading(false);
      }
    };
    restoreUser();
  }, []);

  /* ====================================================
     🔐 ĐĂNG NHẬP VỚI PI SDK → VERIFY BACKEND
  ===================================================== */
  const pilogin = async () => {
    if (!window?.Pi) return alert("⚠ Chỉ dùng trong Pi Browser!");

    try {
      const scopes = ["username", "payments"];
      const { user, accessToken } = await window.Pi.authenticate(scopes);

      // 👉 Gửi accessToken đến backend để verify thật
      const res = await fetch("/api/pi/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken }),
      });

      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        document.cookie = `pi_user=${JSON.stringify(data.user)}; path=/; secure; samesite=lax`;
      }
    } catch (err) {
      console.error("❌ Đăng nhập thất bại:", err);
      alert("❌ Lỗi đăng nhập Pi Network");
    }
  };

  /* ====================================================
     🚪 ĐĂNG XUẤT
  ===================================================== */
  const logout = () => {
    setUser(null);
    document.cookie = "pi_user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, piReady, pilogin, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
