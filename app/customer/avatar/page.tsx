"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AvatarPage() {
  const { user, piReady } = useAuth();
  const router = useRouter();

  const [preview, setPreview] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // 🔐 Kiểm tra đăng nhập
  useEffect(() => {
    if (piReady && !user) router.replace("/pilogin");
  }, [piReady, user, router]);

  // 🧩 Lấy avatar hiện tại từ Redis qua API
  useEffect(() => {
    if (!user?.username) return;
    (async () => {
      try {
        const res = await fetch(`/api/getAvatar?username=${user.username}`);
        const data = await res.json();
        if (data?.avatar) setAvatarUrl(data.avatar);
      } catch (err) {
        console.error("❌ Không thể tải avatar:", err);
      } finally {
        setFetching(false);
      }
    })();
  }, [user]);

  if (!piReady || !user)
    return <div className="min-h-screen bg-gray-100"></div>;

  // ✅ Xử lý chọn ảnh mới
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  // ✅ Upload ảnh lên server
  const handleUpload = async () => {
    if (!selectedFile) {
      alert("⚠️ Vui lòng chọn ảnh trước khi tải lên!");
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("username", user.username);

      const res = await fetch("/api/uploadAvatar", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi tải ảnh");

      alert("✅ Ảnh đại diện đã được cập nhật thành công!");
      setAvatarUrl(data.url);
      setPreview(null);
    } catch (err: any) {
      alert("❌ Lỗi tải ảnh: " + (err.message || "Không xác định"));
    } finally {
      setLoading(false);
    }
  };

  // 🧭 Giao diện
  return (
    <main className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">
      <div className="bg-white p-6 rounded-xl shadow-lg text-center w-80">
        <div className="relative w-28 h-28 mx-auto mb-4">
          {/* Avatar hiển thị theo thứ tự ưu tiên: Preview > Avatar từ Redis > Default */}
          <img
            src={
              preview ||
              avatarUrl ||
              "/default-avatar.png"
            }
            alt="avatar"
            className="w-28 h-28 rounded-full object-cover border-4 border-orange-500"
          />

          {/* Nút chọn ảnh */}
          <label className="absolute bottom-0 right-0 bg-orange-500 p-2 rounded-full cursor-pointer hover:bg-orange-600 transition">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            📸
          </label>
        </div>

        <h1 className="text-lg font-semibold text-gray-800 mb-1">
          {user.username}
        </h1>
        <p className="text-gray-600 text-sm mb-4">
          Cập nhật ảnh đại diện của bạn
        </p>

        <button
          onClick={handleUpload}
          disabled={loading}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg w-full"
        >
          {loading ? "⏳ Đang tải lên..." : "📤 Lưu ảnh đại diện"}
        </button>

        <button
          onClick={() => router.back()}
          className="mt-4 text-blue-600 hover:underline text-sm block mx-auto"
        >
          ← Quay lại
        </button>

        {fetching && (
          <p className="text-gray-400 text-sm mt-3">
            ⏳ Đang tải ảnh đại diện hiện tại...
          </p>
        )}
      </div>
    </main>
  );
}
