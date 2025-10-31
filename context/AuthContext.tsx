"use client";

import { createContext, useContext, useState, useEffect } from "react";

// 🧩 Kiểu dữ liệu người dùng Pi
interface PiUser {
  username: string;
  uid?: string;
  accessToken: string;
}

// 🧩 Interface cho Context
interface AuthContextType {
  user: PiUser | null;
  piReady: boolean;
  pilogin: () => Promise<void>;
  logout: () => void;
}

// 🧠 Tạo context mặc định
const AuthContext = createContext<AuthContextType>({
  user: null,
  piReady: false,
  pilogin: async () => {},
  logout: () => {},
});

// 🧩 Provider bao quanh toàn bộ app
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<PiUser | null>(null);
  const [piReady, setPiReady] = useState(false);

  // ✅ Kiểm tra Pi SDK đã load chưa
  useEffect(() => {
    const timer = setInterval(() => {
      if (typeof window !== "undefined" && window.Pi) {
        setPiReady(true);
        clearInterval(timer);
      }
    }, 500);
    return () => clearInterval(timer);
  }, []);

  // ✅ Load user từ localStorage khi reload trang
  useEffect(() => {
    try {
      const saved = localStorage.getItem("pi_user");
      if (saved) {
        const parsed = JSON.parse(saved);
        const username = parsed?.user?.username || parsed?.username || null;
        const accessToken = parsed?.accessToken || "";
        if (username && accessToken) {
          setUser({ username, accessToken });
        }
      }
    } catch (err) {
      console.error("❌ Lỗi đọc pi_user:", err);
    }
  }, []);

  // ✅ Hàm pilogin - phiên bản ổn định cho SDK Pi mới (callback)
  const pilogin = async () => {
    if (typeof window === "undefined" || !window.Pi) {
      alert("⚠️ Vui lòng mở trong Pi Browser");
      return;
    }

    try {
      const scopes = ["username", "payments"];
      const onIncompletePayment = (payment: any) => {
        console.log("⚠️ Payment chưa hoàn tất:", payment);
      };

      // 👉 Dùng callback gốc của SDK Pi, không bọc Promise
      window.Pi.authenticate(
        scopes,
        onIncompletePayment,
        (authResult: any) => {
          if (!authResult || authResult.error) {
            console.error("❌ Lỗi xác thực:", authResult?.error);
            alert("Đăng nhập thất bại, vui lòng thử lại.");
            return;
          }

          const username = authResult.user?.username || "guest";
          const accessToken = authResult.accessToken || "";

          const piUser: PiUser = { username, accessToken };

          // ✅ Lưu state và localStorage đồng bộ
          setUser(piUser);
          localStorage.setItem("pi_user", JSON.stringify(authResult));
          localStorage.setItem("titi_is_logged_in", "true");

          console.log("✅ Đăng nhập thành công:", piUser);
          alert(`🎉 Xin chào ${username}`);
        }
      );
    } catch (err) {
      console.error("❌ Lỗi đăng nhập:", err);
      alert("Đăng nhập thất bại, vui lòng thử lại.");
    }
  };

  // ✅ Hàm logout
  const logout = () => {
    try {
      if (typeof window !== "undefined" && window.Pi?.logout) {
        window.Pi.logout();
      }
    } catch (err) {
      console.warn("⚠️ Lỗi logout Pi:", err);
    }
    setUser(null);
    localStorage.removeItem("pi_user");
    localStorage.removeItem("titi_is_logged_in");
  };

  return (
    <AuthContext.Provider value={{ user, piReady, pilogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// ✅ Hook tiện dụng để dùng trong các trang
export const useAuth = () => useContext(AuthContext);
