"use client";

import { createContext, useContext, useState, useEffect } from "react";

interface PiUser {
  username: string;
  uid?: string;
  accessToken: string; // chỉ tạm lưu để verify với backend
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

  // ✅ Kiểm tra SDK Pi đã sẵn sàng chưa
useEffect(() => {
  if (typeof window !== "undefined" && window.Pi) {
    try {
      window.Pi.init({ version: "2.0", sandbox: true }); // ✅ đổi false khi chạy mainnet
      console.log("✅ Pi SDK đã khởi tạo!");
    } catch (err) {
      console.error("❌ Lỗi khởi tạo Pi SDK:", err);
    }
  }

  const timer = setInterval(() => {
    if (typeof window !== "undefined" && window.Pi) {
      setPiReady(true);
      clearInterval(timer);
    }
  }, 400);
  return () => clearInterval(timer);
}, []);
  // ✅ Khôi phục user khi reload
  useEffect(() => {
    try {
      const saved = localStorage.getItem("pi_user");
      if (saved) {
        const parsed = JSON.parse(saved);
        const username = parsed?.user?.username || parsed?.username;
        const accessToken = parsed?.accessToken || "";
        if (username && accessToken) {
          setUser({ username, accessToken });
          localStorage.setItem("titi_username", username);
          localStorage.setItem("titi_is_logged_in", "true");
        }
      }
    } catch (err) {
      console.error("❌ Lỗi đọc pi_user:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ Đăng nhập bằng Pi SDK
  const pilogin = async () => {
    if (typeof window === "undefined" || !window.Pi) {
      alert("⚠️ Vui lòng mở trong Pi Browser!");
      return;
    }

    try {
      const scopes = ["username", "payments"];
      const authResult = await window.Pi.authenticate(scopes, (payment: any) =>
        console.log("⚠️ Payment chưa hoàn tất:", payment)
      );

      if (!authResult) throw new Error("Không nhận được phản hồi từ Pi Network");

      const username = authResult.user?.username || "guest";
      const accessToken = authResult.accessToken || "";

      const piUser: PiUser = { username, accessToken };
      setUser(piUser);

      // ✅ Chỉ lưu thông tin cần thiết
      localStorage.setItem("pi_user", JSON.stringify({ username, accessToken }));
      localStorage.setItem("titi_is_logged_in", "true");
      localStorage.setItem("titi_username", username);

      console.log("✅ Đăng nhập thành công:", piUser);
    } catch (err: any) {
      console.error("❌ Lỗi đăng nhập:", err);
      alert("❌ Đăng nhập thất bại. Vui lòng thử lại.");
    }
  };

  // ✅ Đăng xuất
  const logout = () => {
    try {
      if (typeof window !== "undefined" && window.Pi?.logout) {
        window.Pi.logout();
      }
    } catch {
      console.warn("⚠️ Pi SDK không hỗ trợ logout");
    }
    setUser(null);
    localStorage.removeItem("pi_user");
    localStorage.removeItem("titi_is_logged_in");
    localStorage.removeItem("titi_username");
  };

  return (
    <AuthContext.Provider value={{ user, piReady, loading, pilogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
