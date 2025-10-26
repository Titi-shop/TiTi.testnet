"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function PiLoginPage() {
  const [isPiBrowser, setIsPiBrowser] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loginStatus, setLoginStatus] = useState("checking");
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      if (typeof window === "undefined") return;
      try {
        if (window.Pi) {
          await window.Pi.init({
            version: "2.0",
            sandbox: process.env.NEXT_PUBLIC_PI_ENV === "sandbox",
          });
          setIsPiBrowser(true);
          console.log("✅ Pi SDK initialized");

          const saved = localStorage.getItem("pi_user");
          if (saved) {
            const u = JSON.parse(saved);
            if (u.username) {
              console.log("✅ Đã đăng nhập:", u.username);
              setLoginStatus("already");
              setTimeout(() => router.replace("/customer"), 1000);
              return;
            }
          }
          setLoginStatus("ready");
        } else {
          console.warn("⚠️ Không phát hiện Pi Browser");
          setLoginStatus("no_pi");
        }
      } catch (err) {
        console.error("❌ Init Pi lỗi:", err);
        setLoginStatus("error");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [router]);

  const handleLogin = async () => {
    if (!window.Pi) {
      alert("⚠️ Hãy mở trang bằng Pi Browser");
      return;
    }
    setLoading(true);
    try {
      const scopes = ["username", "payments", "wallet_address"];
      const auth = await window.Pi.authenticate(scopes, (p: any) => console.log("💸 Payment:", p));

      const userData = {
        uid: auth.user.uid,
        username: auth.user.username,
        walletAddress: auth.user.wallet_address,
        accessToken: auth.accessToken,
        scopes: auth.scopes,
        loginTime: new Date().toISOString(),
      };

      localStorage.setItem("pi_user", JSON.stringify(userData));
      alert(`🎉 Xin chào ${userData.username}!`);
      router.replace("/customer");
    } catch (err: any) {
      alert("❌ Lỗi đăng nhập: " + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <main className="text-center mt-10">
        <p>⏳ Đang khởi tạo Pi SDK...</p>
      </main>
    );

  return (
    <main className="text-center p-4">
      <h1 className="text-2xl font-bold mb-3">🔑 Đăng nhập Pi Network</h1>
      {!isPiBrowser && (
        <p className="text-red-500">
          ⚠️ Vui lòng mở trang này trong <strong>Pi Browser</strong> nhé!
        </p>
      )}
      {isPiBrowser && loginStatus === "ready" && (
        <button
          onClick={handleLogin}
          className="bg-orange-500 text-white px-6 py-3 rounded-lg mt-4"
        >
          Đăng nhập bằng Pi
        </button>
      )}
      {loginStatus === "already" && (
        <p className="text-green-600 mt-4">✅ Đã đăng nhập, đang chuyển hướng...</p>
      )}
    </main>
  );
}
