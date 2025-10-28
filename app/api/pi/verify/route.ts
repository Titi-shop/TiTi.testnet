"use client";

import { useAuth } from "@/context/AuthContext";

function LoginWithPi() {
  const { user, piReady, piLogin } = useAuth();

  // ✅ Thêm hàm login kiểm tra backend xác minh token
  const handleLogin = async () => {
    try {
      const authData = await piLogin(); // piLogin() trả về { accessToken, username, ... }

      if (authData?.accessToken) {
        // 🔹 Gửi token tới server để xác minh
        const res = await fetch("/api/pi/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accessToken: authData.accessToken }),
        });

        const data = await res.json();
        if (data.success) {
          console.log("✅ Xác minh thành công:", data.user);
          alert(`🎉 Đăng nhập hợp lệ: ${data.user.username}`);
        } else {
          alert(`⚠️ Xác minh thất bại: ${data.message}`);
        }
      } else {
        alert("❌ Không nhận được accessToken từ Pi Network");
      }
    } catch (err) {
      console.error("💥 Lỗi xác minh:", err);
      alert("💥 Lỗi khi xác minh người dùng!");
    }
  };

  if (user) {
    return (
      <div className="text-center text-green-600 mt-4">
        👤 Xin chào, {user.username}
      </div>
    );
  }

  if (!piReady) {
    return (
      <div className="text-center text-gray-500 mt-4">
        ⏳ Đang tải Pi SDK...
        <br />
        (Hãy mở trong Pi Browser)
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center mt-4">
      <button
        onClick={handleLogin}
        className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600"
      >
        🔐 Đăng nhập với Pi
      </button>
    </div>
  );
}

export default LoginWithPi;
