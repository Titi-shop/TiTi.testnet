"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { countries } from "@/data/countries";
import { provincesByCountry } from "@/data/provinces";

export default function EditProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading, piReady } = useAuth();

  const [info, setInfo] = useState({
    displayName: "",
    email: "",
    phone: "",
    address: "",
    province: "",
    country: "VN",
  });

  const [avatar, setAvatar] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  // 🟢 Load hồ sơ để chỉnh sửa
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/account");
      return;
    }

    const fetchProfile = async () => {
      const res = await fetch(`/api/profile?username=${user.username}`);
      const data = await res.json();

      setInfo({
        displayName: data.displayName || "",
        email: data.email || "",
        phone: data.phone || "",
        address: data.address || "",
        province: data.province || "",
        country: data.country || "VN",
      });

      if (data.avatar) setAvatar(data.avatar);
    };

    fetchProfile();
  }, [authLoading, user]);

  // Upload avatar preview
  const handleFileChange = (e: any) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setAvatar(URL.createObjectURL(file));
    }
  };

  // Upload avatar lên server
  const uploadAvatar = async () => {
    if (!selectedFile) return null;

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("username", user.username);

    const res = await fetch("/api/uploadAvatar", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    return data.url;
  };

  // Lưu hồ sơ
  const handleSave = async () => {
    setSaving(true);

    let avatarUrl = avatar;

    if (selectedFile) avatarUrl = await uploadAvatar();

    const body = {
      ...info,
      username: user.username,
      avatar: avatarUrl,
    };

    await fetch("/api/profile", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });

    alert("✔ Hồ sơ đã lưu!");
    router.push("/customer/profile");
  };

  return (
    <main className="min-h-screen bg-gray-100 p-5 relative">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="absolute top-3 left-3 text-orange-600 text-2xl"
      >
        ←
      </button>

      <div className="max-w-md mx-auto bg-white p-6 rounded-xl shadow-lg mt-10">
        {/* Avatar */}
        <div className="relative w-24 h-24 mx-auto">
          <img
            src={avatar || "/default-avatar.png"}
            className="w-24 h-24 rounded-full object-cover border-4 border-orange-500"
          />
          <label className="absolute bottom-0 right-0 bg-orange-500 p-2 rounded-full cursor-pointer">
            <input type="file" className="hidden" onChange={handleFileChange} />
            📸
          </label>
        </div>

        {/* Display Name */}
        <div className="mt-4">
          <label className="block text-sm text-gray-700">Tên hiển thị</label>
          <input
            type="text"
            className="border rounded w-full px-3 py-2"
            value={info.displayName}
            onChange={(e) => setInfo({ ...info, displayName: e.target.value })}
          />
        </div>

        {/* Email */}
        <div className="mt-4">
          <label className="block text-sm text-gray-700">Email</label>
          <input
            type="email"
            className="border rounded w-full px-3 py-2"
            value={info.email}
            onChange={(e) => setInfo({ ...info, email: e.target.value })}
          />
        </div>

        {/* Phone */}
        <div className="mt-4">
          <label className="block text-sm text-gray-700">Số điện thoại</label>
          <input
            type="text"
            className="border rounded w-full px-3 py-2"
            value={info.phone}
            onChange={(e) => setInfo({ ...info, phone: e.target.value })}
          />
        </div>

        {/* Address */}
        <div className="mt-4">
          <label className="block text-sm text-gray-700">Địa chỉ</label>
          <textarea
            className="border rounded w-full px-3 py-2"
            value={info.address}
            onChange={(e) => setInfo({ ...info, address: e.target.value })}
          />
        </div>

        {/* Nút lưu */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full mt-6 bg-green-500 text-white py-2 rounded"
        >
          {saving ? "Đang lưu..." : "💾 Lưu thay đổi"}
        </button>
      </div>
    </main>
  );
}
