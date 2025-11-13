"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Upload, LogOut, Edit3 } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading, piReady, pilogin } = useAuth();

  const [profile, setProfile] = useState<any>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // 🟢 Load hồ sơ
  useEffect(() => {
    if (authLoading) return;

    const username =
      user?.username ||
      localStorage.getItem("titi_username") ||
      (() => {
        try {
          const data = localStorage.getItem("pi_user");
          if (data) {
            const parsed = JSON.parse(data);
            return parsed?.username || parsed?.user?.username;
          }
        } catch {}
        return null;
      })();

    if (!username) {
      setError("❌ Không tải được hồ sơ. Bạn chưa đăng nhập.");
      setLoading(false);
      return;
    }

    // 📌 Tải thông tin profile
    const loadProfile = async () => {
      try {
        const res = await fetch(`/api/profile?username=${encodeURIComponent(username!)}`);
        const data = await res.json();

        setProfile(data || {});
      } catch (e) {
        setError("Không tải được hồ sơ.");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [authLoading, user]);

  // 🟢 Load avatar riêng từ API
  useEffect(() => {
    if (!user?.username) return;

    fetch(`/api/getAvatar?username=${encodeURIComponent(user.username)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.avatar) setAvatar(data.avatar);
      })
      .catch(() => console.log("⚠ Không thể tải avatar"));
  }, [user]);

  // 📸 Upload avatar
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewURL = URL.createObjectURL(file);
    setPreview(previewURL);

    try {
      setUploading(true);

      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "x-filename": file.name },
        body: file,
      });

      const data = await res.json();

      if (res.ok && data.url) {
        setAvatar(data.url);
        alert("✅ Ảnh đại diện đã cập nhật!");
      } else {
        alert("❌ Lỗi tải: " + (data.error || "Không xác định"));
      }
    } catch (e) {
      alert("⚠ Không thể upload ảnh");
    } finally {
      setUploading(false);
    }
  };

  // 🚪 Đăng xuất
  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
    } catch {}

    localStorage.removeItem("pi_user");
    localStorage.removeItem("titi_username");
    localStorage.removeItem("titi_is_logged_in");

    alert("🚪 Bạn đã đăng xuất!");
    window.location.href = "/account";
  };

  if (loading || authLoading)
    return <p className="p-4 text-center">⏳ Đang tải hồ sơ...</p>;

  if (error)
    return (
      <main className="p-4 text-center text-red-500">
        <p>{error}</p>
        {piReady ? (
          <button
            onClick={pilogin}
            className="mt-4 bg-orange-500 text-white px-4 py-2 rounded"
          >
            🔐 Đăng nhập lại
          </button>
        ) : (
          <p className="mt-4 text-gray-600">🕓 Chờ Pi SDK...</p>
        )}
      </main>
    );

  return (
    <main className="min-h-screen bg-gray-100 pb-24 relative">

      {/* 🔙 Nút quay lại */}
      <button
        onClick={() => router.back()}
        className="absolute top-3 left-3 text-orange-600 text-2xl font-bold"
      >
        ←
      </button>

      {/* Avatar + Username */}
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg mt-12 p-6 relative">
        <div className="relative w-28 h-28 mx-auto mb-4">
          {preview ? (
            <Image
              src={preview}
              alt="Preview"
              fill
              className="rounded-full object-cover border-4 border-orange-500"
            />
          ) : avatar ? (
            <Image
              src={avatar}
              alt="Avatar"
              fill
              className="rounded-full object-cover border-4 border-orange-500"
            />
          ) : (
            <div className="w-28 h-28 rounded-full bg-orange-200 text-orange-600 flex items-center justify-center text-4xl font-bold border-4 border-orange-500">
              {user?.username?.charAt(0).toUpperCase() || "U"}
            </div>
          )}

          {/* Upload Button */}
          <label
            htmlFor="avatar-upload"
            className="absolute bottom-0 right-0 bg-orange-500 p-2 rounded-full cursor-pointer hover:bg-orange-600 transition"
          >
            <Upload size={18} className="text-white" />
          </label>

          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {/* Username chính thức */}
        <h2 className="text-center text-lg font-semibold text-gray-800">
          @{user.username}
        </h2>

        {uploading && (
          <p className="text-sm text-gray-500 mt-1 text-center">Đang tải ảnh...</p>
        )}
      </div>

      {/* Thông tin hồ sơ */}
      <div className="bg-white mt-6 mx-4 p-4 rounded-xl shadow-md space-y-3">
        {[
          { label: "Tên trong ứng dụng (App Name)", key: "displayName" },
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

      {/* Nút hành động */}
      <div className="flex flex-col items-center mt-8 gap-3">
        <button
          onClick={() => router.push("/customer/profile/edit")}
          className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-6 rounded flex items-center gap-2"
        >
          <Edit3 size={18} />
          Chỉnh sửa
        </button>

        <button
          onClick={handleLogout}
          className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-6 rounded flex items-center gap-2"
        >
          <LogOut size={18} />
          Đăng xuất
        </button>
      </div>
    </main>
  );
}
