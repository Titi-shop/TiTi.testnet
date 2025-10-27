"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function PiLoginPage() {
  const [isPiBrowser, setIsPiBrowser] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // ✅ Chờ Pi SDK load hoàn toàn
  useEffect(() => {
    const waitForPi = () =>
      new Promise<void>((resolve, reject) => {
        let tries = 0;
        const check = setInterval(() => {
          if (window.Pi) {
            clearInterval(check);
            resolve();
          } else if (tries++ > 15) {
            clearInterval(check);
            reject("Pi SDK không tải được");
          }
        }, 300);
      });

    const initPi = async () => {
      try {
        await waitForPi();
        console.log("✅ Pi SDK detected, initializing...");

        // ✅ Tự nhận môi trường testnet hay mainnet
        const isTestnet = process.env.NEXT_PUBLIC_PI_ENV === "testnet";
        window.Pi.init({ version: "2.0", sandbox: isTestnet });
        console.log(`✅ Pi SDK initialized (${isTestnet ? "TESTNET" : "MAINNET"})`);

        setIsPiBrowser(true);

        // Nếu đã đăng nhập → vào thẳng trang customer
        const saved = localStorage.getItem("pi_user");
        const isLoggedIn = localStorage.getItem("titi_is_logged_in");
        if (saved && isLoggedIn === "true") router.replace("/customer");
      } catch (err) {
        console.error("❌ Lỗi Pi SDK:", err);
        setIsPiBrowser(false);
      } finally {
        setLoading(false);
      }
    };

    initPi();
  }, [router]);

  const handleLogin = async () => {
    if (!window.Pi) {
      alert("⚠️ Hãy mở trong Pi Browser nhé!");
      return;
    }

    try {
      const scopes = ["username", "payments", "wallet_address"];
      const auth = await window.Pi.authenticate(scopes, (payment: any) => {
        console.log("💸 Payment callback:", payment);
      });

      const username = auth?.user?.username || "guest";
      localStorage.setItem("pi_user", JSON.stringify(auth));
      localStorage.setItem("titi_is_logged_in", "true");
      localStorage.setItem("titi_username", username);

      alert(`🎉 Xin chào ${username}!`);
      router.replace("/customer");
    } catch (err: any) {
      console.error("❌ Lỗi đăng nhập:", err);
      alert("❌ Lỗi đăng nhập: " + err.message);
    }
  };

  if (loading)
    return <main className="text-center mt-10">⏳ Đang tải Pi SDK...</main>;

  return (
    <main style={{ textAlign: "center", padding: "30px" }}>
      <h2>🔐 Đăng nhập bằng Pi Network</h2>
      {!isPiBrowser && (
        <p style={{ color: "red" }}>
          ⚠️ Vui lòng mở bằng <b>Pi Browser</b> để đăng nhập.
        </p>
      )}
      {isPiBrowser && (
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
          }}
        >
          Đăng nhập với Pi
        </button>
      )}
    </main>
  );
}
