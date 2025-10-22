"use client";

import { useRouter } from "next/navigation";

export default function PiLoginPage() {
  const router = useRouter();

  const handleLogin = async () => {
    if (typeof window === "undefined" || !window.Pi) {
      alert("⚠️ Vui lòng mở trang này bằng Pi Browser để đăng nhập!");
      return;
    }

    try {
      window.Pi.init({ version: "2.0", sandbox: false });

      const scopes = ["username", "payments", "wallet_address"];
      const auth = await window.Pi.authenticate(scopes, () => {});
      const username = auth?.user?.username || "guest_user";

      // ✅ Lưu thông tin user
      localStorage.setItem("pi_user", JSON.stringify(auth));
      localStorage.setItem("titi_is_logged_in", "true");
      localStorage.setItem("titi_username", username);

      alert(`🎉 Xin chào ${username}!`);
      router.replace("/customer");
    } catch (err) {
      console.error("❌ Lỗi đăng nhập:", err);
      alert("Không thể đăng nhập. Hãy đảm bảo bạn đang mở trong Pi Browser.");
    }
  };

  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "#f8f9fa",
        textAlign: "center",
      }}
    >
      <button
        onClick={handleLogin}
        style={{
          background: "#6a1b9a",
          color: "#fff",
          border: "none",
          padding: "14px 32px",
          borderRadius: "8px",
          fontSize: "18px",
          fontWeight: "600",
          cursor: "pointer",
          boxShadow: "0 3px 6px rgba(0,0,0,0.2)",
        }}
      >
        Đăng nhập
      </button>
    </main>
  );
}
