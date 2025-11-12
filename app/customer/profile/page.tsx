"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Upload, ArrowLeft, Edit3, Save } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading, piReady, pilogin } = useAuth();

  const [profile, setProfile] = useState<any>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // 🟢 Tải hồ sơ người dùng
  useEffect(() => {
    if (authLoading) return;

    let username =
      user?.username ||
      localStorage.getItem("titi_username") ||
      (() => {
        try {
          const saved = localStorage.getItem("pi_user");
          if (saved) {
            const parsed = JSON.parse(saved);
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

    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/profile?username=${encodeURIComponent(username!)}`);
        if (!res.ok) throw new Error("Không thể tải hồ sơ.");
        const data = await res.json();
        setProfile(data);
        setAvatar(data?.avatar || null);
        setError(null);
      } catch (err) {
        console.error("❌ Lỗi tải hồ sơ:", err);
        setError("Không tải được hồ sơ.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [authLoading, user]);

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
        setProfile((prev: any) => ({ ...prev, avatar: data.url }));
        alert("✅ Ảnh đại diện đã được cập nhật!");
      } else {
        alert("❌ Lỗi tải ảnh: " + (data.error || "Không xác định"));
      }
    } catch (err) {
      console.error("Upload failed:", err);
      alert("⚠️ Không thể tải ảnh lên máy chủ.");
    } finally {
      setUploading(false);
    }
  };

  // 💾 Lưu hồ sơ
  const handleSaveProfile = async () => {
    if (!profile) return;
    const username =
      user?.username ||
      localStorage.getItem("titi_username") ||
      JSON.parse(localStorage.getItem("pi_user") || "{}")?.username;

    if (!username) {
      alert("⚠️ Không thể xác định người dùng.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...profile,
          username,
          avatar,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert("✅ Hồ sơ đã được lưu!");
        setEditing(false);
      } else {
        alert("❌ Cập nhật thất bại: " + (data.error || ""));
      }
    } catch (err) {
      console.error("❌ Lỗi khi lưu hồ sơ:", err);
      alert("⚠️ Không thể lưu thay đổi.");
    } finally {
      setSaving(false);
    }
  };

  // 🚪 Hàm đăng xuất → API + redirect /account
  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
    } catch (e) {
      console.warn("Không thể gọi API logout:", e);
    } finally {
      localStorage.removeItem("pi_user");
      localStorage.removeItem("titi_username");
      localStorage.removeItem("titi_is_logged_in");
      alert("🚪 Bạn đã đăng xuất!");
      window.location.href = "/account"; // 👉 chuyển về trang account
    }
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
            className="mt-4 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded"
          >
            🔐 Đăng nhập lại
          </button>
        ) : (
          <p className="mt-4 text-gray-600">🕓 Đang chờ Pi SDK...</p>
        )}
      </main>
    );

  return (
    <main className="min-h-screen bg-gray-50 pb-10">
      {/* ===== tiêu đề ===== */}
      <div className="flex items-center bg-white p-4 shadow-sm">
        <button onClick={() => router.back()} className="text-gray-600 hover:text-orange-500">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-lg font-semibold text-gray-800 mx-auto">Hồ sơ người dùng</h1>
      </div>

      {/* ===== avatar ===== */}
      <div className="flex flex-col items-center mt-8">
        <div className="relative w-28 h-28">
          {preview ? (
            <Image src={preview} alt="Preview" fill className="rounded-full object-cover border-4 border-orange-500" />
          ) : avatar ? (
            <Image src={avatar} alt="Avatar" fill className="rounded-full object-cover border-4 border-orange-500" />
          ) : (
            <div className="w-28 h-28 rounded-full bg-orange-200 text-orange-600 flex items-center justify-center text-4xl font-bold border-4 border-orange-500">
              {profile?.username?.charAt(0).toUpperCase()}
            </div>
          )}
          <label
            htmlFor="avatar-upload"
            className="absolute bottom-0 right-0 bg-orange-500 p-2 rounded-full cursor-pointer hover:bg-orange-600 transition"
          >
            <Upload size={18} className="text-white" />
          </label>
          <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </div>

        <p className="mt-4 text-lg font-semibold text-gray-800">
          {profile?.displayName || profile?.username || "Người dùng"}
        </p>
        {uploading && <p className="text-sm text-gray-500 mt-2">Đang tải ảnh...</p>}
      </div>

      {/* ===== thông tin ===== */}
      <div className="bg-white mt-6 mx-4 p-4 rounded-lg shadow space-y-3">
        {[
          { label: "Tên hiển thị", key: "displayName" },
          { label: "Email", key: "email" },
          { label: "Điện thoại", key: "phone" },
          { label: "Địa chỉ", key: "address" },
        ].map(({ label, key }) => (
          <div key={key}>
            <strong>{label}:</strong>{" "}
            {editing ? (
              key === "address" ? (
                <textarea
                  value={profile?.[key] || ""}
                  onChange={(e) =>
                    setProfile((prev: any) => ({ ...prev, [key]: e.target.value }))
                  }
                  className="border p-1 rounded w-full mt-1"
                  rows={2}
                />
              ) : (
                <input
                  value={profile?.[key] || ""}
                  onChange={(e) =>
                    setProfile((prev: any) => ({ ...prev, [key]: e.target.value }))
                  }
                  className="border p-1 rounded w-full mt-1"
                />
              )
            ) : (
              <span>{profile?.[key] || "(chưa có)"}</span>
            )}
          </div>
        ))}
      </div>

      {/* ===== nút hành động ===== */}
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
              saving ? "bg-gray-400" : "bg-green-600 hover:bg-green-700 active:bg-green-800"
            } text-white font-semibold py-2 px-6 rounded flex items-center gap-2`}
          >
            <Save size={18} />
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        )}
      </div>

      {/* ===== nút đăng xuất ===== */}
      <div className="flex justify-center mt-6">
        <button
          onClick={handleLogout}
          className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-6 rounded"
        >
          🚪 Đăng xuất
        </button>
      </div>
    </main>
  );
}
