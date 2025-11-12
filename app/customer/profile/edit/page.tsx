"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { countries } from "@/data/countries";
import { provincesByCountry } from "@/data/provinces";

export default function EditProfilePage() {
  const router = useRouter();
  const [info, setInfo] = useState({
    pi_uid: "",
    displayName: "",
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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);

  // ✅ Lấy thông tin user từ localStorage / API
  useEffect(() => {
    try {
      const stored = localStorage.getItem("pi_user");
      const logged = localStorage.getItem("titi_is_logged_in");

      if (stored && logged === "true") {
        const parsed = JSON.parse(stored);
        const user = parsed.user || {};
        setInfo((prev) => ({
          ...prev,
          pi_uid: user.uid || user.id || "",
          displayName: user.username || "",
        }));
        setIsLoggedIn(true);

        // ✅ Lấy thông tin hồ sơ
        if (user.uid || user.id) {
          fetch(`/api/profile?pi_uid=${user.uid || user.id}`)
            .then((res) => res.json())
            .then((data) => {
              if (data) {
                setInfo((prev) => ({ ...prev, ...data }));
                if (data.avatar) setAvatar(data.avatar);
              }
            })
            .catch(() => console.log("⚠️ Không thể tải hồ sơ"));
        }
      } else {
        alert("⚠️ Vui lòng đăng nhập bằng Pi Network trước!");
        router.replace("/pilogin");
      }
    } catch (err) {
      console.error("❌ Lỗi đọc thông tin đăng nhập:", err);
    }
  }, [router]);

  // ✅ Upload avatar
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setAvatar(URL.createObjectURL(file));
    }
  };

  const handleUploadAvatar = async () => {
    if (!selectedFile) {
      alert("⚠️ Vui lòng chọn ảnh trước khi tải lên!");
      return;
    }

    const username = info.displayName || info.pi_uid;
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("username", username);

      const res = await fetch("/api/uploadAvatar", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (res.ok) {
        setAvatar(data.url);
        alert("✅ Ảnh đại diện đã được cập nhật!");
      } else {
        alert("❌ Lỗi tải ảnh: " + data.error);
      }
    } catch (err: any) {
      alert("❌ Không thể tải ảnh lên: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Lưu hồ sơ
  const handleSave = async () => {
    if (!isLoggedIn || !info.pi_uid) {
      alert("❌ Không thể lưu — chưa đăng nhập Pi Network.");
      return;
    }

    setSaving(true);
    try {
      const body = { ...info, avatar };

      const res = await fetch("/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-uid": info.pi_uid,
          "x-username": info.displayName,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.success) {
        alert("✅ Hồ sơ đã được lưu!");
        router.push("/customer/profile");
      } else {
        alert("❌ Lưu thất bại!");
        console.error(data.error);
      }
    } catch (err) {
      console.error("❌ Lỗi khi lưu hồ sơ:", err);
      alert("❌ Có lỗi xảy ra khi lưu hồ sơ.");
    } finally {
      setSaving(false);
    }
  };

  const provinceList = provincesByCountry[info.country] || [];

  return (
    <main className="min-h-screen bg-gray-100 pb-32 relative">
      {/* 🔙 Nút quay lại */}
      <button
        onClick={() => router.back()}
        className="absolute top-3 left-3 text-orange-600 text-lg font-bold"
      >
        ←
      </button>

      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg mt-12 p-6">
        {/* 🧍 Ảnh đại diện */}
        <div className="relative w-24 h-24 mx-auto mb-4">
          <img
            src={
              avatar ||
              `/api/getAvatar?username=${info.displayName}` ||
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

        <h1 className="text-center text-lg font-semibold text-gray-800 mb-4">
          {info.displayName || "Người dùng"}
        </h1>

        {/* 🧾 Form thông tin */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Tên người dùng</label>
            <input
              type="text"
              className="w-full border px-3 py-2 rounded"
              value={info.displayName}
              onChange={(e) => setInfo({ ...info, displayName: e.target.value })}
            />
          </div>

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
                <option value="+81">🇯🇵 +81</option>
                <option value="+82">🇰🇷 +82</option>
                <option value="+33">🇫🇷 +33</option>
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
              placeholder="Số nhà, đường, phường..."
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Quốc gia</label>
            <select
              className="w-full border px-3 py-2 rounded"
              value={info.country}
              onChange={(e) =>
                setInfo({ ...info, country: e.target.value, province: "" })
              }
            >
              {countries.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Tỉnh / Thành phố
            </label>
            <select
              className="w-full border px-3 py-2 rounded"
              value={info.province}
              onChange={(e) => setInfo({ ...info, province: e.target.value })}
            >
              <option value="">-- Chọn --</option>
              {provinceList.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ⚙️ Nút lưu */}
        <div className="flex flex-col mt-6 space-y-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded"
          >
            {saving ? "Đang lưu..." : "💾 Lưu thay đổi"}
          </button>

          <button
            onClick={handleUploadAvatar}
            disabled={loading}
            className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded"
          >
            {loading ? "Đang tải..." : "📤 Cập nhật ảnh đại diện"}
          </button>
        </div>
      </div>
    </main>
  );
}
