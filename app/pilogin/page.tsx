"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function PiLoginPage() {
  const [isPiBrowser, setIsPiBrowser] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // ✅ Tự động kiểm tra và đăng nhập nếu có Pi SDK
  useEffect(() => {
    const initPi = async () => {
      if (typeof window === "undefined") return;

      // Kiểm tra có Pi SDK không
      if (window.Pi) {
        setIsPiBrowser(true);
        try {
          window.Pi.init({ version: "2.0", sandbox: false });

          const saved = localStorage.getItem("pi_user");
          const isLoggedIn = localStorage.getItem("titi_is_logged_in");

          // Nếu đã đăng nhập rồi → chuyển đến /customer
          if (saved && isLoggedIn === "true") {
            router.replace("/customer");
            return;
          }

          // ✅ Tự động đăng nhập Pi
          const scopes = ["username", "payments", "wallet_address"];
          const auth = await window.Pi.authenticate(scopes, () => {});
          const username = auth?.user?.username || "guest_user";

          localStorage.setItem("pi_user", JSON.stringify(auth));
          localStorage.setItem("titi_is_logged_in", "true");
          localStorage.setItem("titi_username", username);

          console.log("✅ Tự động đăng nhập thành công:", username);
          router.replace("/customer");
        } catch (err: any) {
          console.error("❌ Lỗi tự động đăng nhập:", err);
          setLoading(false);
        }
      } else {
        // Không phải Pi Browser
        setIsPiBrowser(false);
        setLoading(false);
      }
    };

    initPi();
  }, [router]);

  // ✅ Nút đăng nhập thủ công (dự phòng)
  const handleLogin = async () => {
    if (!window.Pi) {
      alert("⚠️ Vui lòng mở trang này bằng Pi Browser.");
      return;
    }

    try {
      const scopes = ["username", "payments", "wallet_address"];
      const auth = await window.Pi.authenticate(scopes, () => {});
      const username = auth?.user?.username || "guest_user";

      localStorage.setItem("pi_user", JSON.stringify(auth));
      localStorage.setItem("titi_is_logged_in", "true");
      localStorage.setItem("titi_username", username);

      alert(`🎉 Xin chào ${username}, đăng nhập thành công!`);
      router.replace("/customer");
    } catch (err: any) {
      console.error("❌ Lỗi đăng nhập:", err);
      alert("❌ Lỗi đăng nhập: " + err.message);
    }
  };

  return (
    <main
      style={{
        textAlign: "center",
        padding: "40px 20px",
        minHeight: "100vh",
        background: "#f9fafb",
      }}
    >
      <h2 style={{ color: "#6a1b9a", marginBottom: "20px" }}>
        🔐 Đăng nhập bằng Pi Network
      </h2>

      {!isPiBrowser ? (
        <p style={{ color: "red", fontWeight: "500" }}>
          ⚠️ Vui lòng mở trang này bằng <b>Pi Browser</b> để đăng nhập.
        </p>
      ) : loading ? (
        <p>⏳ Đang kiểm tra đăng nhập Pi Network...</p>
      ) : (
        <button
          onClick={handleLogin}
          style={{
            background: "#ff7b00",
            color: "#fff",
            border: "none",
            padding: "12px 25px",
            borderRadius: "8px",
            fontSize: "16px",
            cursor: "pointer",
            marginTop: "20px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
          }}
        >
          Đăng nhập với Pi
        </button>
      )}
    </main>
  );
}
