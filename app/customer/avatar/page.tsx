"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function AvatarPage() {
  const { user, piReady } = useAuth();
  const router = useRouter();
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (piReady && !user) router.replace("/pilogin");
  }, [piReady, user, router]);

  if (!piReady || !user) return <div className="min-h-screen bg-gray-100"></div>;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert("Vui lòng chọn ảnh trước khi tải lên!");
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("file", selectedFile);
      const username = user?.username || localStorage.getItem("titi_username") || "";
if (!username) {
  alert("⚠️ Không xác định được username. Vui lòng đăng nhập lại.");
  router.replace("/pilogin");
  return;
}
formData.append("username", username);

      const res = await fetch("/api/uploadAvatar", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi tải ảnh");

      alert("✅ Ảnh đại diện đã được cập nhật!");
      router.refresh();
    } catch (err: any) {
      alert("❌ Lỗi tải ảnh: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">
      <div className="bg-white p-6 rounded-xl shadow-lg text-center w-80">
        <div className="relative w-24 h-24 mx-auto mb-4">
          <img
            src={
              preview ||
              `/api/getAvatar?username=${user.username}` ||
              "/default-avatar.png"
            }
            alt="avatar"
            className="w-24 h-24 rounded-full object-cover border-4 border-orange-500"
          />
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

        <h1 className="text-lg font-semibold text-gray-800 mb-2">{user.username}</h1>
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
      </div>
    </main>
  );
}
