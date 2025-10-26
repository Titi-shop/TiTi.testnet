"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function PiLoginPage() {
  const { user, piReady, piLogin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("titi_is_logged_in") === "true";
    if (isLoggedIn && user?.username) {
      // dùng location để chắc chắn redirect trong Pi Browser
      window.location.href = "/customer";
    }
  }, [user]);

  return (
    <main style={{ textAlign: "center", padding: 24 }}>
      <h2>🔐 Đăng nhập bằng Pi Network</h2>
      {!piReady && (
        <p style={{ color: "#666" }}>
          ⏳ Đang tải Pi SDK... (hãy mở trong Pi Browser)
        </p>
      )}
      {piReady && !user && (
        <button
          onClick={piLogin}
          style={{
            background: "#ff7b00",
            color: "#fff",
            border: "none",
            padding: "12px 24px",
            borderRadius: 8,
            fontSize: 16,
            cursor: "pointer",
            marginTop: 16,
          }}
        >
          Đăng nhập với Pi
        </button>
      )}
      {piReady && user && <p>✅ Đã đăng nhập, đang chuyển hướng...</p>}
    </main>
  );
}
