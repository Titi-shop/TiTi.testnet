"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { LogOut, Edit3 } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();

  const [profile, setProfile] = useState<any>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) return;

    fetch(`/api/profile?username=${user.username}`)
      .then((res) => res.json())
      .then((data) => {
        setProfile(data || {});
        setAvatar(data?.avatar || null);
      })
      .finally(() => setLoading(false));
  }, [authLoading, user]);

  if (loading)
    return <p className="p-4 text-center">⏳ Đang tải...</p>;

  return (
    <main className="min-h-screen bg-gray-100 pb-24 relative">

      {/* Nút quay lại */}
      <button
        onClick={() => router.back()}
        className="absolute top-4 left-4 text-orange-500 text-3xl font-bold"
      >
        ←
      </button>

      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg mt-12 p-6">

        {/* Avatar */}
        <div className="relative w-28 h-28 mx-auto mb-4">
          <Image
            src={avatar || "/default-avatar.png"}
            alt="Avatar"
            fill
            className="rounded-full object-cover border-4 border-orange-500"
          />
        </div>

        {/* Hiển thị Username (Pi Network) */}
        <h2 className="text-center text-xl font-bold text-gray-900">
          {user?.username}
        </h2>

        {/* ⚠️ Đã loại bỏ hiển thị email dưới avatar */}
        {/* KHÔNG CÒN: <p className="text-center text-gray-500">@{profile?.username}</p> */}

        {/* Thông tin user */}
        <div className="bg-white p-4 rounded-xl shadow-md space-y-3 mt-4">
          {[
            { label: "Biệt danh trong ứng dụng", key: "appName" },
            { label: "Email", key: "email" },
            { label: "Điện thoại", key: "phone" },
            { label: "Địa chỉ", key: "address" },
            { label: "Tỉnh / Thành phố", key: "province" },
            { label: "Quốc gia", key: "country" },
          ].map(({ label, key }) => (
            <div key={key} className="flex justify-between border-b pb-2">
              <span className="text-gray-600">{label}</span>
              <span className="text-gray-800 font-medium text-right">
                {profile?.[key] || "(chưa có)"}
              </span>
            </div>
          ))}
        </div>

        {/* Nút chỉnh sửa */}
        <button
          onClick={() => router.push("/customer/profile/edit")}
          className="mt-6 bg-orange-500 text-white py-2 px-6 rounded flex items-center gap-2 mx-auto"
        >
          <Edit3 size={18} /> Chỉnh sửa
        </button>
      </div>
    </main>
  );
}
