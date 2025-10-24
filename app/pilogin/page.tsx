"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PiLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const handleLogin = async () => {
    if (!agreed) {
      alert("⚠️ Vui lòng đồng ý điều khoản trước khi đăng nhập.");
      return;
    }

    if (!window.Pi) {
      alert("⚠️ Vui lòng mở trang trong Pi Browser để đăng nhập!");
      return;
    }

    try {
      setLoading(true);
      window.Pi.init({ version: "2.0", sandbox: false });

      const scopes = ["username", "payments", "wallet_address"];
      const auth = await window.Pi.authenticate(scopes, () => {});

      if (!auth?.accessToken) {
        alert("Không thể lấy accessToken từ Pi Network.");
        return;
      }

      const verifyRes = await fetch("/api/pi/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: auth.accessToken }),
      });

      const verifyData = await verifyRes.json();

      if (!verifyData?.success) {
        alert("Đăng nhập thất bại: " + verifyData.message);
        return;
      }

      const user = verifyData.user;
      localStorage.setItem("titi_username", user.username);
      localStorage.setItem("titi_uid", user.uid);
      localStorage.setItem("titi_is_logged_in", "true");
      localStorage.setItem("titi_access_token", auth.accessToken);

      alert(`🎉 Xin chào ${user.username}!`);
      router.replace("/");
    } catch (err: any) {
      console.error("❌ Lỗi đăng nhập:", err);
      alert("Không thể đăng nhập: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-white text-center px-6">
      <button
        onClick={handleLogin}
        disabled={loading || !agreed}
        className={`${
          loading
            ? "bg-gray-400"
            : agreed
            ? "bg-orange-500 hover:bg-orange-600"
            : "bg-gray-300"
        } text-white font-semibold py-3 px-10 rounded-full text-lg shadow-md mb-6`}
      >
        {loading ? "Đang đăng nhập..." : "Đăng nhập với Pi"}
      </button>

      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <input
          type="checkbox"
          checked={agreed}
          onChange={() => setAgreed(!agreed)}
          className="w-4 h-4 accent-orange-500 cursor-pointer"
        />
        <label>Đồng ý với điều khoản và chính sách</label>
      </div>
    </main>
  );
}
