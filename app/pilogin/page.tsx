"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function PiLoginPage() {
  const [isPiBrowser, setIsPiBrowser] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loginStatus, setLoginStatus] = useState("checking");
  const router = useRouter();

  // ✅ KHỞI TẠO PI SDK AN TOÀN
  useEffect(() => {
    const initPi = async () => {
      if (typeof window === "undefined") return;

      try {
        // 🔸 Chờ Pi SDK load (tránh trường hợp window.Pi chưa sẵn sàng)
        let retries = 0;
        while (typeof window.Pi === "undefined" && retries < 20) {
          console.log("⏳ Chờ Pi SDK load...");
          await new Promise((r) => setTimeout(r, 500));
          retries++;
        }

        if (!window.Pi) {
          console.warn("⚠️ Không phát hiện Pi Browser");
          setLoginStatus("no_pi");
          setLoading(false);
          return;
        }

        console.log("✅ Pi SDK phát hiện, khởi tạo...");

        // 🔹 KHÔNG DÙNG await (Pi.init không trả Promise hợp lệ)
        window.Pi.init({
          version: "2.0",
          sandbox: true, // 🔥 BẮT BUỘC nếu đang chạy Pi Testnet
        });

        setIsPiBrowser(true);
        console.log("✅ Pi SDK initialized thành công");

        // 🔸 Kiểm tra user cũ trong localStorage
        const saved = localStorage.getItem("pi_user");
        if (saved) {
          const u = JSON.parse(saved);
          if (u.username) {
            console.log("✅ Đã đăng nhập:", u.username);
            setLoginStatus("already");
            setTimeout(() => router.replace("/customer"), 1000);
            setLoading(false);
            return;
          }
        }

        setLoginStatus("ready");
      } catch (err) {
        console.error("❌ Lỗi khởi tạo Pi SDK:", err);
        setLoginStatus("error");
      } finally {
        setLoading(false);
      }
    };

    initPi();
  }, [router]);

  // ✅ XỬ LÝ ĐĂNG NHẬP VỚI PI
  const handleLogin = async () => {
    if (!window.Pi) {
      alert("⚠️ Hãy mở trang này bằng Pi Browser để đăng nhập.");
      return;
    }

    setLoading(true);
    try {
      const scopes = ["username", "payments", "wallet_address"];
      const auth = await window.Pi.authenticate(scopes, (payment: any) =>
        console.log("💸 Payment callback:", payment)
      );

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
      console.error("❌ Pi Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ GIAO DIỆN
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
          className="bg-orange-500 text-white px-6 py-3 rounded-lg mt-4 hover:bg-orange-600"
        >
          Đăng nhập bằng Pi
        </button>
      )}

      {loginStatus === "already" && (
        <p className="text-green-600 mt-4">
          ✅ Đã đăng nhập, đang chuyển hướng...
        </p>
      )}
    </main>
  );
}
