"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function PiLoginPage() {
  const { user, piReady, piLogin } = useAuth();
  const router = useRouter();

  // ✅ Nếu user đã đăng nhập → tự chuyển đến /customer
  useEffect(() => {
    const isLoggedIn = localStorage.getItem("titi_is_logged_in") === "true";
    if (isLoggedIn && user?.username) {
      router.replace("/customer");
    }
  }, [user, router]);

  // ✅ Hiển thị trạng thái SDK
  if (!piReady) {
    return (
      <main className="text-center mt-10">
        ⏳ Đang tải Pi SDK... <br />
        (Vui lòng mở trang này bằng <b>Pi Browser Testnet</b>)
      </main>
    );
  }

  // ✅ Nếu đã đăng nhập
  if (user) {
    return (
      <main className="text-center mt-10">
        ✅ Xin chào <b>{user.username}</b>! <br />
        Đang chuyển hướng đến trang khách hàng...
      </main>
    );
  }

  // ✅ Nếu chưa đăng nhập
  return (
    <main
      style={{
        textAlign: "center",
        padding: "30px",
      }}
    >
      <h2>🔐 Đăng nhập bằng Pi Network</h2>
      <p style={{ color: "#555", marginTop: "10px" }}>
        Hãy mở trang này bằng <b>Pi Browser Testnet</b>.
      </p>

      <button
        onClick={piLogin}
        style={{
          background: "#ff7b00",
          color: "#fff",
          border: "none",
          padding: "12px 25px",
          borderRadius: "8px",
          fontSize: "16px",
          cursor: "pointer",
          marginTop: "20px",
        }}
      >
        Đăng nhập với Pi
      </button>
    </main>
  );
}
