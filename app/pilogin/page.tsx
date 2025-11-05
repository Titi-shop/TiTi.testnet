"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function PiLoginPage() {
  const router = useRouter();
  const { user, piReady, pilogin } = useAuth();

  const [status, setStatus] = useState("⏳ Đang tải...");
  const [agreed, setAgreed] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // ✅ Kiểm tra nếu user đã đăng nhập sẵn
  useEffect(() => {
    if (user) {
      setStatus(`🎉 Xin chào ${user.username}`);
      setTimeout(() => {
        router.push("/customer");
      }, 1200);
    } else {
      setIsChecking(false);
    }
  }, [user, router]);

  // ✅ Theo dõi trạng thái Pi SDK
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!piReady) {
      setStatus("⚙️ Đang khởi động Pi SDK...");
      return;
    }

    if (!user) {
      setStatus(""); // loại bỏ dòng "Sẵn sàng đăng nhập..."
    }
  }, [piReady, user]);

  // ✅ Xử lý đăng nhập
  const handleLogin = async () => {
    if (!agreed) {
      alert("⚠️ Vui lòng đọc và đồng ý với điều khoản trước khi đăng nhập.");
      return;
    }

    if (!piReady || typeof window === "undefined" || !window.Pi) {
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

  if (isChecking) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen bg-white text-gray-500 text-lg">
        ⏳ Đang kiểm tra đăng nhập...
      </main>
    );
  }

  // ✅ Giao diện chính (giữ nút cố định, không dịch chuyển)
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-white text-center px-6 relative">
      {/* 🔹 Trạng thái (hiển thị nhỏ phía trên nút, không đẩy nút xuống) */}
      {status && (
        <p className="text-gray-700 mb-2 text-sm absolute top-[40%]">
          {status}
        </p>
      )}

      {/* 🔹 Nút đăng nhập */}
      <div className="flex flex-col items-center justify-center space-y-4">
        <button
          onClick={handleLogin}
          disabled={!piReady || !agreed}
          className={`${
            piReady && agreed
              ? "bg-orange-500 hover:bg-orange-600 cursor-pointer"
              : "bg-gray-300 cursor-not-allowed"
          } text-white font-semibold py-3 px-10 rounded-full text-lg shadow-md transition-all duration-200`}
        >
          Đăng nhập với Pi
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
            Tôi đã đọc và đồng ý với{" "}
            <a
              href="https://www.termsfeed.com/live/7eae894b-14dd-431c-99da-0f94cab5b9ac"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-500 underline"
            >
              《Điều khoản sử dụng》
            </a>{" "}
            và{" "}
            <a
              href="https://www.termsfeed.com/live/32e8bf86-ceaf-4eb6-990e-cd1fa0b0775e"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-500 underline"
            >
              《Chính sách bảo mật》
            </a>
          </label>
        </div>
      </div>

      {/* 🔹 Footer */}
      <footer className="absolute bottom-6 text-gray-400 text-xs">
        © copyRight 2023 1pi.app
      </footer>
    </main>
  );
}
