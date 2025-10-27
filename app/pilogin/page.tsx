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
      router.replace("/customer");
    }
  }, [user, router]);

  if (!piReady) {
    return (
      <main className="text-center mt-10">
        ⏳ Đang tải Pi SDK... (mở trong Pi Browser Testnet)
      </main>
    );
  }

  if (user) {
    return (
      <main className="text-center mt-10">
        ✅ Xin chào <b>{user.username}</b>! Đang chuyển hướng...
      </main>
    );
  }

  return (
    <main style={{ textAlign: "center", padding: 30 }}>
      <h2>🔐 Đăng nhập bằng Pi Network</h2>
      <p className="text-gray-500 mt-2">
        Hãy dùng <b>Pi Browser Testnet</b> để đăng nhập.
      </p>
      <button
        onClick={piLogin}
        className="mt-4 bg-orange-500 text-white px-5 py-3 rounded-lg hover:bg-orange-600"
      >
        Đăng nhập với Pi
      </button>
    </main>
  );
}
