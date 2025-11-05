"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function PiLoginPage() {
  const router = useRouter();
  const { user, piReady, pilogin } = useAuth();
  const [status, setStatus] = useState("⏳ Đang tải...");

  // Theo dõi SDK Pi & trạng thái user
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!piReady) {
      setStatus("⚙️ Đang khởi động Pi SDK...");
      return;
    }

    if (user) {
      setStatus(`🎉 Xin chào ${user.username}`);
      // ✅ Tự động chuyển sang trang customer sau 1.2s
      setTimeout(() => {
        router.push("/customer");
      }, 1200);
      return;
    }

    setStatus("🔐 Sẵn sàng đăng nhập bằng Pi Network");
  }, [piReady, user, router]);

  // Xử lý đăng nhập
  const handleLogin = async () => {
    if (!piReady || !window.Pi) {
      alert("⚠️ Vui lòng mở bằng Pi Browser và chờ SDK load xong!");
      return;
    }

    try {
      setStatus("🔑 Đang xác thực tài khoản...");
      await pilogin();
      setStatus("✅ Đăng nhập thành công!");
      setTimeout(() => {
        router.push("/customer");
      }, 1200);
    } catch (err: any) {
      console.error("❌ Lỗi đăng nhập:", err);
      setStatus("❌ Lỗi đăng nhập: " + (err.message || "Không rõ nguyên nhân"));
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
      <h1 className="text-2xl font-bold mb-4 text-orange-600">
        🔐 Đăng nhập bằng Pi Network
      </h1>

      <p className="mb-4 text-gray-700">{status}</p>

      <button
        onClick={handleLogin}
        disabled={!piReady}
        className={`px-6 py-3 rounded-lg text-white transition ${
          piReady
            ? "bg-orange-500 hover:bg-orange-600"
            : "bg-gray-400 cursor-not-allowed"
        }`}
      >
        Đăng nhập với Pi
      </button>

      <p className="mt-6 text-sm text-gray-500">
        Sau khi đăng nhập, bạn sẽ được chuyển đến trang{" "}
        <span className="font-semibold">"Tài khoản / Customer"</span>.
      </p>
    </main>
  );
}
