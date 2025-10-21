"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem("user_info");
    if (!stored) return;

    const user = JSON.parse(stored);
    fetch(`/api/profile?pi_uid=${user.pi_uid}`)
      .then((res) => res.json())
      .then((data) => {
        setProfile(data || {});
      })
      .catch(() => console.log("Không tải được hồ sơ"));
  }, []);

  if (!profile) return <p className="p-4">Đang tải...</p>;

  return (
    <main className="p-4 max-w-md mx-auto">
      <h1 className="text-xl font-bold text-orange-600 mb-4">👤 Hồ sơ cá nhân</h1>

      <div className="space-y-2">
        <p><strong>Tên đăng nhập:</strong> {profile.displayName || "(chưa có)"}</p>
        <p><strong>Email:</strong> {profile.email || "(chưa có)"}</p>
        <p><strong>Điện thoại:</strong> {profile.phone || "(chưa có)"}</p>
        <p><strong>Địa chỉ:</strong> {profile.address || "(chưa có)"}</p>
      </div>

      <button
        onClick={() => router.push("/customer/profile/edit")}
        className="mt-6 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
      >
        ✏️ Chỉnh sửa
      </button>
    </main>
  );
}
