"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function PiLoginPage() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    const loggedIn = localStorage.getItem("titi_is_logged_in");
    const piUser = localStorage.getItem("pi_user");

    if (loggedIn === "true" && piUser) {
      router.replace("/customer");
    } else {
      setIsChecking(false);
    }
  }, [router]);

  const handleLogin = async () => {
    if (!agreed) {
      alert("⚠️ Vui lòng đồng ý điều khoản trước khi đăng nhập.");
      return;
    }
    if (!window.Pi) {
      alert("⚠️ Hãy mở trong Pi Browser!");
      return;
    }

    try {
      window.Pi.init({ version: "2.0", sandbox: false });
      const scopes = ["username", "payments", "wallet_address"];
      const auth = await window.Pi.authenticate(scopes, () => {});
      const username = auth?.user?.username;

      // ✅ Xác minh thật với Pi API
      const verifyRes = await fetch("/api/pi/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: auth.accessToken }),
      });
      const verifyData = await verifyRes.json();

      if (!verifyData.success) {
        alert("❌ Xác minh Pi thất bại. Vui lòng thử lại.");
        return;
      }

      localStorage.setItem("pi_user", JSON.stringify(verifyData.user));
      localStorage.setItem("titi_is_logged_in", "true");
      localStorage.setItem("titi_username", verifyData.user.username);
      localStorage.setItem("titi_access_token", auth.accessToken);

      alert(`🎉 Xin chào ${verifyData.user.username}!`);
      router.replace("/customer");
    } catch (err: any) {
      console.error("❌ Login error:", err);
      alert("Không thể đăng nhập: " + err.message);
    }
  };

  if (isChecking) return <div className="p-6 text-center">⏳ Kiểm tra đăng nhập...</div>;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-white">
      <button
        onClick={handleLogin}
        disabled={!agreed}
        className={`px-6 py-3 rounded-full text-white font-semibold ${
          agreed ? "bg-orange-600" : "bg-gray-400"
        }`}
      >
        Login with Pi
      </button>

      <div className="mt-4 flex items-center text-sm text-gray-600">
        <input
          type="checkbox"
          checked={agreed}
          onChange={() => setAgreed(!agreed)}
          className="mr-2 accent-orange-500"
        />
        Tôi đồng ý với{" "}
        <a
          href="https://www.termsfeed.com/live/7eae894b-14dd-431c-99da-0f94cab5b9ac"
          target="_blank"
          className="text-orange-600 underline ml-1"
        >
          điều khoản sử dụng
        </a>
      </div>
    </main>
  );
}
