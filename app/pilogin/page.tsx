"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function PiLoginPage() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  // ✅ Tự kiểm tra đăng nhập Pi
  useEffect(() => {
    const loggedIn = localStorage.getItem("titi_is_logged_in");
    const piUser = localStorage.getItem("pi_user");

    if (loggedIn === "true" && piUser) {
      router.replace("/customer");
    } else {
      setIsChecking(false);
    }
  }, [router]);

  // ✅ Xử lý đăng nhập qua Pi Network
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

      localStorage.setItem("pi_user", JSON.stringify(auth));
      localStorage.setItem("titi_is_logged_in", "true");
      localStorage.setItem("titi_username", username);
      localStorage.setItem("titi_access_token", auth?.accessToken || "");

      alert(`🎉 Xin chào ${username}!`);
      router.replace("/customer");
    } catch (err) {
      console.error("❌ Lỗi đăng nhập:", err);
      alert("Không thể đăng nhập. Hãy đảm bảo bạn đang mở trong Pi Browser.");
    }
  };

  if (isChecking) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen bg-white text-gray-500 text-lg">
        ⏳ Đang kiểm tra đăng nhập...
      </main>
    );
  }

  // ✅ Giao diện đơn giản như ảnh bạn gửi
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-white text-center px-6">
      {/* Nút đăng nhập */}
      <button
        onClick={handleLogin}
        className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-10 rounded-full text-lg shadow-md transition-all duration-200 mb-6"
      >
        User login
      </button>

      {/* Điều khoản */}
      <p className="text-gray-600 text-sm leading-relaxed">
        <span className="text-orange-500 mr-1">✔</span>
        Read & Agree{" "}
        <a href="#" className="text-orange-500">
          《User agreement》
        </a>{" "}
        And{" "}
        <a href="#" className="text-orange-500">
          《Privacy agreement》
        </a>
      </p>

      {/* Footer */}
      <footer className="absolute bottom-6 text-gray-400 text-xs">
        © copyRight 2023 1pi.app
      </footer>
    </main>
  );
}
