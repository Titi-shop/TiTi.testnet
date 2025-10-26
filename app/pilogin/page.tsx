"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function PiLoginPage() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [agreed, setAgreed] = useState(false);

  // ✅ Kiểm tra đăng nhập sẵn
  useEffect(() => {
    const loggedIn = localStorage.getItem("titi_is_logged_in");
    const piUser = localStorage.getItem("pi_user");

    if (loggedIn === "true" && piUser) {
      router.replace("/customer");
    } else {
      setIsChecking(false);
    }
  }, [router]);

  // ✅ Giao diện đơn giản có 2 link điều khoản
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-white text-center px-6">
      {/* 🔸 Nút đăng nhập */}
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

      {/* 🔸 Điều khoản & cam kết */}
      <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
        <input
          type="checkbox"
          id="agree"
          checked={agreed}
          onChange={() => setAgreed(!agreed)}
          className="w-4 h-4 accent-orange-500 cursor-pointer"
        />
        <label htmlFor="agree" className="select-none leading-snug">
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

      {/* 🔸 Footer */}
      <footer className="absolute bottom-6 text-gray-400 text-xs">
        © copyRight 2023 1pi.app
      </footer>
    </main>
  );
}
