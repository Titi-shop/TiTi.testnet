"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { countries } from "@/data/countries";
import { provincesByCountry } from "@/data/provinces";
import { phoneRules } from "@/data/phoneRules"; // ✅ thêm

export default function EditProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading, piReady, pilogin } = useAuth();

  const [info, setInfo] = useState({
    pi_uid: "",
    appName: "",
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
    if (!user) return;

    const username = user.username || localStorage.getItem("titi_username");

    fetch(`/api/profile?username=${encodeURIComponent(username!)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setInfo((prev) => ({
            ...prev,
            pi_uid: data.pi_uid || "",
            appName: data.appName || data.displayName || username!,
            email: data.email || "",
            phone: data.phone || "",
            address: data.address || "",
            province: data.province || "",
            country: data.country || "VN",
            phoneCode:
              phoneRules[data.country || "VN"]?.dialCode || "+84",
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

  // 📤 Upload avatar
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
      alert("❌ Bạn chưa đăng nhập.");
      return;
    }

    // ✅ KIỂM TRA EMAIL HỢP LỆ
    const emailPattern =
      /^[a-zA-Z0-9._%+-]+@(?:gmail\.com|yahoo\.com|hotmail\.com|outlook\.com|icloud\.com|[\w.-]+\.\w{2,})$/;

    if (info.email && !emailPattern.test(info.email)) {
      alert("⚠️ Email không hợp lệ, vui lòng kiểm tra lại!");
      return;
    }

    setSaving(true);
    try {
      const body = {
        ...info,
        username: user.username,
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
    } catch {
      alert("❌ Lỗi khi lưu hồ sơ.");
    } finally {
      setSaving(false);
    }
  };

  const provinceList = provincesByCountry[info.country] || [];

  if (!piReady || authLoading || !user) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Đang tải dữ liệu...</p>
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
              avatar || `/api/getAvatar?username=${user.username}`
            }
            alt="avatar"
            className="w-24 h-24 rounded-full object-cover border-4 border-orange-500"
          />
          <label className="absolute bottom-0 right-0 bg-orange-500 p-2 rounded-full cursor-pointer">
            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
            📸
          </label>
        </div>

        {/* Username */}
        <h1 className="text-center text-lg font-semibold text-gray-800 mb-4">
          {user?.username || "User"}
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

          {/* Email */}
          <div>
            <label className="block text-sm text-gray-700 mb-1">Email</label>
            <input
              type="email"
              className="w-full border px-3 py-2 rounded"
              value={info.email}
              onChange={(e) => setInfo({ ...info, email: e.target.value })}
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm text-gray-700 mb-1">Số điện thoại</label>
            <div className="flex space-x-2">
              <select
                className="border px-2 py-2 rounded w-24"
                value={info.phoneCode}
                onChange={(e) => {
                  const dial = e.target.value;
                  const found = Object.entries(phoneRules).find(
                    ([code, rule]) => rule.dialCode === dial
                  );
                  setInfo({
                    ...info,
                    phoneCode: dial,
                    country: found?.[0] || info.country,
                  });
                }}
              >
                {Object.entries(phoneRules).map(([code, rule]) => (
                  <option key={code} value={rule.dialCode}>
                    {countries.find((c) => c.code === code)?.flag} {rule.dialCode}
                  </option>
                ))}
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

          {/* Address */}
          <div>
            <label className="block text-sm text-gray-700 mb-1">Địa chỉ</label>
            <textarea
              className="w-full border px-3 py-2 rounded h-20"
              value={info.address}
              onChange={(e) => setInfo({ ...info, address: e.target.value })}
            />
          </div>

          {/* Country */}
          <div>
            <label className="block text-sm text-gray-700 mb-1">Quốc gia</label>
            <select
              className="w-full border px-3 py-2 rounded"
              value={info.country}
              onChange={(e) =>
                setInfo({
                  ...info,
                  country: e.target.value,
                  phoneCode: phoneRules[e.target.value]?.dialCode || info.phoneCode,
                  province: "",
                })
              }
            >
              {countries.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Province */}
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
