"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Upload, ArrowLeft, Edit3, Save } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // ✅ Lấy thông tin user khi mở trang
  useEffect(() => {
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

      fetch(`/api/profile?pi_uid=${pi_uid || ""}&username=${username || ""}`)
        .then(async (res) => {
          if (!res.ok) throw new Error("Lỗi kết nối đến máy chủ");
          const data = await res.json();
          setProfile(data || {});
          setAvatar(data?.avatar || null);
        })
        .catch(() => setError("Không tải được hồ sơ."))
        .finally(() => setLoading(false));
    } catch (err) {
      console.error("Lỗi parse user:", err);
      setError("Dữ liệu người dùng không hợp lệ.");
      setLoading(false);
    }
  }, []);

  // 📸 Upload ảnh đại diện
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewURL = URL.createObjectURL(file);
    setPreview(previewURL);

    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploading(true);
      const res = await fetch("/api/uploadAvatar", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setAvatar(data.url);
        setProfile((prev: any) => ({ ...prev, avatar: data.url }));
        alert("✅ Ảnh đại diện đã được cập nhật!");
      } else {
        alert("❌ Lỗi tải ảnh: " + data.error);
      }
    } catch (error) {
      console.error("Upload failed:", error);
      alert("⚠️ Không thể tải ảnh lên máy chủ.");
    } finally {
      setUploading(false);
    }
  };

  // 💾 Lưu thay đổi hồ sơ
  const handleSaveProfile = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert("✅ Hồ sơ đã được cập nhật!");
        setEditing(false);
      } else {
        alert("❌ Cập nhật thất bại!");
      }
    } catch (err) {
      console.error("❌ Lỗi khi lưu hồ sơ:", err);
      alert("⚠️ Không thể lưu thay đổi.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="p-4 text-center">⏳ Đang tải...</p>;
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
    <main className="min-h-screen bg-gray-50 pb-10">
      {/* ===== Thanh tiêu đề ===== */}
      <div className="flex items-center bg-white p-4 shadow-sm">
        <button
          onClick={() => router.back()}
          className="text-gray-600 hover:text-orange-500"
        >
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-lg font-semibold text-gray-800 mx-auto">
          Hồ sơ người dùng
        </h1>
      </div>

      {/* ===== Avatar ===== */}
      <div className="flex flex-col items-center mt-8">
        <div className="relative w-28 h-28">
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
              {profile?.username?.charAt(0).toUpperCase()}
            </div>
          )}

          {/* 📤 Nút đổi ảnh */}
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

        {/* Tên hiển thị */}
        <p className="mt-4 text-lg font-semibold text-gray-800">
          {profile?.displayName || profile?.username || "Người dùng"}
        </p>
        {uploading && <p className="text-sm text-gray-500 mt-2">Đang tải ảnh...</p>}
      </div>

      {/* ===== Thông tin người dùng ===== */}
      <div className="bg-white mt-6 mx-4 p-4 rounded-lg shadow space-y-3">
        <div>
          <strong>Tên hiển thị:</strong>{" "}
          {editing ? (
            <input
              value={profile?.displayName || ""}
              onChange={(e) =>
                setProfile((prev: any) => ({
                  ...prev,
                  displayName: e.target.value,
                }))
              }
              className="border p-1 rounded w-full mt-1"
            />
          ) : (
            <span>{profile?.displayName || "(chưa có)"}</span>
          )}
        </div>

        <div>
          <strong>Email:</strong>{" "}
          {editing ? (
            <input
              value={profile?.email || ""}
              onChange={(e) =>
                setProfile((prev: any) => ({ ...prev, email: e.target.value }))
              }
              className="border p-1 rounded w-full mt-1"
            />
          ) : (
            <span>{profile?.email || "(chưa có)"}</span>
          )}
        </div>

        <div>
          <strong>Điện thoại:</strong>{" "}
          {editing ? (
            <input
              value={profile?.phone || ""}
              onChange={(e) =>
                setProfile((prev: any) => ({ ...prev, phone: e.target.value }))
              }
              className="border p-1 rounded w-full mt-1"
            />
          ) : (
            <span>{profile?.phone || "(chưa có)"}</span>
          )}
        </div>

        <div>
          <strong>Địa chỉ:</strong>{" "}
          {editing ? (
            <textarea
              value={profile?.address || ""}
              onChange={(e) =>
                setProfile((prev: any) => ({ ...prev, address: e.target.value }))
              }
              className="border p-1 rounded w-full mt-1"
              rows={2}
            />
          ) : (
            <span>{profile?.address || "(chưa có)"}</span>
          )}
        </div>
      </div>

      {/* ===== Nút hành động ===== */}
      <div className="flex justify-center gap-4 mt-6">
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-6 rounded flex items-center gap-2"
          >
            <Edit3 size={18} />
            Chỉnh sửa
          </button>
        ) : (
          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className={`${
              saving
                ? "bg-gray-400"
                : "bg-green-600 hover:bg-green-700 active:bg-green-800"
            } text-white font-semibold py-2 px-6 rounded flex items-center gap-2`}
          >
            <Save size={18} />
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        )}
      </div>
    </main>
  );
}
