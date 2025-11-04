"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function PiLoginPage() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [agreed, setAgreed] = useState(false);

  // ✅ Kiểm tra tự động nếu đã đăng nhập
  useEffect(() => {
    const loggedIn = localStorage.getItem("titi_is_logged_in");
    const piUser = localStorage.getItem("pi_user");

    if (loggedIn === "true" && piUser) {
      router.replace("/customer");
    } else {
      setIsChecking(false);
    }
  }, [router]);

  // ✅ Đăng nhập với Pi Browser
  const handleLogin = async () => {
    if (!agreed) {
      alert("⚠️ Vui lòng đọc và đồng ý với các điều khoản trước khi đăng nhập.");
      return;
    }

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

  // ✅ Giao diện đăng nhập có điều khoản
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-white text-center px-6">
      {/* 🔹 Nút đăng nhập */}
      <button
        onClick={handleLogin}
        disabled={!agreed}
        className={`${
          agreed
            ? "bg-orange-500 hover:bg-orange-600 cursor-pointer"
            : "bg-gray-300 cursor-not-allowed"
        } text-white font-semibold py-3 px-10 rounded-full text-lg shadow-md transition-all duration-200 mb-6`}
      >
        User login
      </button>

      {/* 🔹 Điều khoản sử dụng */}
      <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
        <input
          type="checkbox"
          id="agree"
          checked={agreed}
          onChange={() => setAgreed(!agreed)}
          className="w-4 h-4 accent-orange-500 cursor-pointer"
        />
        <label htmlFor="agree" className="select-none">
          Read & Agree{" "}
          <a
            href="https://www.termsfeed.com/live/7eae894b-14dd-431c-99da-0f94cab5b9ac"
            target="_blank"
            rel="noopener noreferrer"
            className="text-orange-500 underline"
          >
            《User agreement》
          </a>{" "}
          and{" "}
          <a
            href="https://www.termsfeed.com/live/32e8bf86-ceaf-4eb6-990e-cd1fa0b0775e"
            target="_blank"
            rel="noopener noreferrer"
            className="text-orange-500 underline"
          >
            《Privacy agreement》
          </a>
        </label>
      </div>

      {/* 🔹 Footer */}
      <footer className="absolute bottom-6 text-gray-400 text-xs">
        © copyRight 2023 1pi.app
      </footer>
    </main>
  );
}
