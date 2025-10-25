"use client";

import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext<any>(null);

/**
 * ✅ AuthContext (bản thật, không giả lập)
 * - Lưu thông tin người dùng đăng nhập bằng Pi Network
 * - Hỗ trợ đăng nhập / đăng xuất thật qua Pi SDK
 * - Không còn phần “mock user” hoặc chọn vai trò thủ công
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);

  // 🔹 Khi app load, khôi phục thông tin user từ localStorage
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("pi_user");
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (err) {
      console.error("❌ Lỗi khi đọc localStorage:", err);
    }
  }, []);

  // ✅ Hàm đăng nhập bằng Pi SDK thật (Testnet hoặc Mainnet)
  const piLogin = async () => {
    try {
      if (typeof window === "undefined" || !(window as any).Pi) {
        alert("⚠️ Pi SDK chưa sẵn sàng. Hãy mở trang này bằng Pi Browser.");
        return;
      }

      const Pi = (window as any).Pi;

      // ⚙️ Khởi tạo SDK nếu chưa init
      if (!Pi.initialized) {
        Pi.init({ version: "2.0", sandbox: true }); // ❌ Không còn sandbox
      }

      const scopes = ["username", "payments", "wallet_address"];
      const auth = await Pi.authenticate(scopes, (payment: any) => {
        console.log("📦 Payment callback:", payment);
      });

      if (!auth?.user?.username) {
        alert("❌ Không lấy được thông tin người dùng từ Pi Network.");
        return;
      }

      const piUser = {
        username: auth.user.username,
        wallet: auth.user.wallet_address,
        accessToken: auth.accessToken,
      };

      // ✅ Lưu thông tin người dùng
      setUser(piUser);
      localStorage.setItem("pi_user", JSON.stringify(piUser));
      console.log("✅ Đăng nhập Pi thành công:", piUser);
      alert("✅ Đăng nhập Pi thành công!");
    } catch (err: any) {
      console.error("❌ Lỗi đăng nhập Pi:", err);
      alert("Đăng nhập Pi thất bại: " + (err.message || "Không xác định."));
    }
  };

  // ✅ Đăng xuất
  const logout = () => {
    try {
      localStorage.removeItem("pi_user");
      setUser(null);
      console.log("🚪 Đã đăng xuất Pi user.");
    } catch (err) {
      console.error("❌ Lỗi khi đăng xuất:", err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, piLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
