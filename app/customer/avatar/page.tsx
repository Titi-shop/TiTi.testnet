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

  // 🔹 Điều hướng nếu chưa login
  useEffect(() => {
    if (piReady && !user) {
      router.replace("/pilogin");
    }
  }, [piReady, user, router]);

  // 🔹 Log user (KHÔNG đặt sau return)
  useEffect(() => {
    if (user) {
      console.log("👤 User info:", user);
    }
  }, [user]);

  if (!piReady || !user) {
    return <div className="min-h-screen bg-gray-100"></div>;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert("⚠️ Vui lòng chọn ảnh trước khi tải lên!");
      return;
    }

    const username =
      user.username || localStorage.getItem("titi_username") || "";

    if (!username) {
      alert("⚠️ Không xác định được username. Vui lòng đăng nhập lại.");
      router.replace("/pilogin");
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("username", username.trim());

      const res = await fetch("/api/uploadAvatar", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Lỗi tải ảnh");
      }

      alert("✅ Ảnh đại diện đã được cập nhật!");
      router.refresh();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Lỗi không xác định";
      alert("❌ Lỗi tải ảnh: " + message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="bg-white p-6 rounded-xl shadow-lg text-center w-80">
        <div className="relative w-24 h-24 mx-auto mb-4">
          <img
            src={
              preview
                ? preview
                : `/api/getAvatar?username=${user.username}`
            }
            alt="Avatar"
            className="w-24 h-24 rounded-full object-cover border-4 border-orange-500"
          />
          <label className="absolute bottom-0 right-0 bg-orange-500 p-2 rounded-full cursor-pointer">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            📸
          </label>
        </div>

        <h1 className="text-lg font-semibold mb-2">{user.username}</h1>

        <button
          onClick={handleUpload}
          disabled={loading}
          className="bg-orange-500 text-white px-4 py-2 rounded-lg w-full"
        >
          {loading ? "⏳ Đang tải..." : "📤 Lưu ảnh"}
        </button>

        <button
          onClick={() => router.back()}
          className="mt-4 text-blue-600 text-sm"
        >
          ← Quay lại
        </button>
      </div>
    </main>
  );
}
