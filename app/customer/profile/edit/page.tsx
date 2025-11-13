"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { countries } from "@/data/countries";
import { provincesByCountry } from "@/data/provinces";

export default function EditProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading, piReady, pilogin } = useAuth();

  const [info, setInfo] = useState({
    pi_uid: "",
    appName: "",       // Tên dùng trong app
    email: "",
    phoneCode: "+84",
    phone: "",
    address: "",
    province: "",
    country: "VN",
  });

  const [avatar, setAvatar] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  // 🟢 Load profile
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      alert("⚠️ Vui lòng đăng nhập bằng Pi Network trước!");
      router.replace("/account");
      return;
    }

    const username = user.username || localStorage.getItem("titi_username");

    fetch(`/api/profile?username=${encodeURIComponent(username!)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setInfo((prev) => ({
            ...prev,
            pi_uid: data.pi_uid || "",
            appName: data.appName || data.displayName || "", // tên phụ
            email: data.email || "",
            phone: data.phone || "",
            address: data.address || "",
            province: data.province || "",
            country: data.country || "VN",
          }));

          if (data.avatar) setAvatar(data.avatar);
        }
      })
      .catch(() => console.log("⚠️ Không thể tải hồ sơ"));
  }, [authLoading, user, router]);

  // 📸 Preview avatar
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setAvatar(URL.createObjectURL(file));
    }
  };

  // Upload avatar thật
  const handleUploadAvatar = async () => {
    if (!selectedFile) {
      alert("⚠️ Vui lòng chọn ảnh trước!");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("username", user?.username || "");

      const res = await fetch("/api/uploadAvatar", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setAvatar(data.url);
        alert("✅ Ảnh đại diện đã cập nhật!");
      } else {
        alert("❌ Lỗi tải ảnh: " + data.error);
      }
    } catch (err: any) {
      alert("❌ Không thể tải: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 💾 Lưu hồ sơ
  const handleSave = async () => {
    if (!user) {
      alert("❌ Chưa đăng nhập Pi Network.");
      return;
    }

    setSaving(true);
    try {
      const body = {
        ...info,
        username: user.username,

        // API cũ yêu cầu displayName → map từ appName
        displayName: info.appName,
        avatar,
      };

      const res = await fetch("/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.accessToken}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.success) {
        alert("✅ Hồ sơ đã lưu!");
        router.push("/customer/profile");
      } else {
        alert("❌ Lỗi: " + (data.error || ""));
      }
    } catch (err) {
      alert("❌ Lỗi khi lưu hồ sơ.");
    } finally {
      setSaving(false);
    }
  };

  const provinceList = provincesByCountry[info.country] || [];

  if (!piReady && !authLoading) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-gray-500 mb-2">🕓 Đang khởi tạo Pi SDK...</p>
        <p className="text-sm text-gray-400">(Vui lòng mở trong Pi Browser)</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 pb-32 relative">
      <button
        onClick={() => router.back()}
        className="absolute top-3 left-3 text-orange-600 text-lg font-bold"
      >
        ←
      </button>

      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg mt-12 p-6">
        {/* Avatar */}
        <div className="relative w-24 h-24 mx-auto mb-4">
          <img
            src={
              avatar ||
              `/api/getAvatar?username=${user?.username || "unknown"}`
            }
            alt="avatar"
            className="w-24 h-24 rounded-full object-cover border-4 border-orange-500"
          />
          <label className="absolute bottom-0 right-0 bg-orange-500 p-2 rounded-full cursor-pointer">
            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
            📸
          </label>
        </div>

        {/* 🔥 Chỉ hiển thị username của Pi Network */}
        <h1 className="text-center text-lg font-semibold text-gray-800 mb-4">
          {user.username}
        </h1>

        {/* Form */}
        <div className="space-y-4">
          {/* App Name */}
          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Tên trong ứng dụng (App Name)
            </label>
            <input
              type="text"
              className="w-full border px-3 py-2 rounded"
              value={info.appName}
              onChange={(e) => setInfo({ ...info, appName: e.target.value })}
            />
          </div>

          {/* Giữ nguyên tất cả các trường còn lại */}
          <div>
            <label className="block text-sm text-gray-700 mb-1">Email</label>
            <input
              type="email"
              className="w-full border px-3 py-2 rounded"
              value={info.email}
              onChange={(e) => setInfo({ ...info, email: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Số điện thoại</label>
            <div className="flex space-x-2">
              <select
                className="border px-2 py-2 rounded w-24"
                value={info.phoneCode}
                onChange={(e) => setInfo({ ...info, phoneCode: e.target.value })}
              >
                <option value="+84">🇻🇳 +84</option>
                <option value="+1">🇺🇸 +1</option>
              </select>
              <input
                type="tel"
                className="flex-1 border px-3 py-2 rounded"
                value={info.phone}
                onChange={(e) => setInfo({ ...info, phone: e.target.value })}
                placeholder="Nhập số điện thoại"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Địa chỉ</label>
            <textarea
              className="w-full border px-3 py-2 rounded h-20"
              value={info.address}
              onChange={(e) => setInfo({ ...info, address: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Quốc gia</label>
            <select
              className="w-full border px-3 py-2 rounded"
              value={info.country}
              onChange={(e) => setInfo({ ...info, country: e.target.value, province: "" })}
            >
              {countries.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Tỉnh / Thành phố</label>
            <select
              className="w-full border px-3 py-2 rounded"
              value={info.province}
              onChange={(e) => setInfo({ ...info, province: e.target.value })}
            >
              <option value="">-- Chọn --</option>
              {provinceList.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col mt-6 space-y-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-green-500 text-white py-2 rounded"
          >
            {saving ? "Đang lưu..." : "💾 Lưu thay đổi"}
          </button>

          <button
            onClick={handleUploadAvatar}
            disabled={loading}
            className="bg-orange-500 text-white py-2 rounded"
          >
            {loading ? "Đang tải..." : "📤 Cập nhật ảnh đại diện"}
          </button>
        </div>
      </div>
    </main>
  );
}
