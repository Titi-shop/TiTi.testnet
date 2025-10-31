"use client";

import { useAuth } from "@/context/AuthContext";

function LoginWithPi() {
  const { user, piReady, login } = useAuth();

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
        onClick={pilogin}
        className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600"
      >
        User pilogin
      </button>
    </div>
  );
}

export default LoginWithPi; // ✅ PHẢI CÓ DÒNG NÀY
