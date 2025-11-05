"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // ✅ Lấy thông tin user từ localStorage
    const stored =
      localStorage.getItem("pi_user") || localStorage.getItem("user_info");

    if (!stored) {
      setError("❌ Bạn chưa đăng nhập. Vui lòng đăng nhập lại.");
      setLoading(false);
      return;
    }

    try {
      const user = JSON.parse(stored);
      const pi_uid = user?.user?.uid || user?.pi_uid || null;
      const username = user?.user?.username || user?.username || "guest_user";

      if (!pi_uid && !username) {
        setError("Không tìm thấy thông tin tài khoản.");
        setLoading(false);
        return;
      }

      // ✅ Gọi API để lấy thông tin hồ sơ
      fetch(`/api/profile?pi_uid=${pi_uid || ""}&username=${username || ""}`)
        .then(async (res) => {
          if (!res.ok) throw new Error("Lỗi kết nối đến máy chủ");
          const data = await res.json();
          setProfile(data || {});
        })
        .catch(() => setError("Không tải được hồ sơ."))
        .finally(() => setLoading(false));
    } catch (err) {
      console.error("Lỗi parse user:", err);
      setError("Dữ liệu người dùng không hợp lệ.");
      setLoading(false);
    }
  }, []);

  if (loading) return <p className="p-4">⏳ Đang tải...</p>;
  if (error)
    return (
      <main className="p-4 text-center text-red-500">
        <p>{error}</p>
        <button
          onClick={() => router.replace("/pilogin")}
          className="mt-4 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded"
        >
          🔐 Đăng nhập lại
        </button>
      </main>
    );

  return (
    <main className="p-4 max-w-md mx-auto">
      <h1 className="text-xl font-bold text-orange-600 mb-4">
        👤 Hồ sơ cá nhân
      </h1>

      <div className="space-y-2 bg-white p-4 rounded-lg shadow">
        <p>
          <strong>Tên đăng nhập:</strong>{" "}
          {profile.displayName || profile.username || "(chưa có)"}
        </p>
        <p>
          <strong>Email:</strong> {profile.email || "(chưa có)"}
        </p>
        <p>
          <strong>Điện thoại:</strong> {profile.phone || "(chưa có)"}
        </p>
        <p>
          <strong>Địa chỉ:</strong> {profile.address || "(chưa có)"}
        </p>
      </div>

      <button
        onClick={() => router.push("/customer/profile/edit")}
        className="mt-6 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded w-full"
      >
        ✏️ Chỉnh sửa hồ sơ
      </button>
    </main>
  );
}
