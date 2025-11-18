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
    appName: "", // Biệt danh trong app
    email: "",
    phoneCode: "+00",
    phone: "",
    address: "",
    province: "",
    country: "VN",
  });

  const [avatar, setAvatar] = useState<string | null>(null);

  // 🟢 Load profile
  useEffect(() => {
    if (authLoading || !user) return;

    fetch(`/api/profile?username=${encodeURIComponent(user.username)}`)
      .then((res) => res.json())
      .then((data) => {
        const cc = data.country || "VN";
        const countryData = countries.find((c) => c.code === cc);

        setInfo({
          appName: data.appName || "", // ⭐ chỉ lấy appName, không lấy displayName nữa
          email: data.email || "",
          phone: data.phone || "",
          address: data.address || "",
          province: data.province || "",
          country: cc,
          phoneCode: countryData?.dial || "+00",
        });

        if (data.avatar) setAvatar(data.avatar);
      })
      .catch(() => console.log("⚠️ Không thể tải hồ sơ"));
  }, [authLoading, user]);

  // 📸 Avatar preview
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewURL = URL.createObjectURL(file);
      setAvatar(previewURL);
    }
  };

  // 💾 Save profile
  const handleSave = async () => {
    if (!user) {
      alert("Bạn chưa đăng nhập!");
      return;
    }

    const body = {
      ...info,
      username: user.username, // giữ định danh
      avatar,
    };

    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (data.success) {
      alert("Đã lưu thành công!");
      router.push("/customer/profile");
    } else alert("Lỗi khi lưu dữ liệu");
  };

  const provinceList = provincesByCountry[info.country] || [];

  // 🚨 Chặn nếu chưa đăng nhập
  if (!piReady || authLoading || !user) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p>⏳ Đang tải hoặc chưa đăng nhập...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 pb-32 relative">

      {/* 🔙 Back */}
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
            src={avatar || `/api/getAvatar?username=${user.username}`}
            alt="avatar"
            className="w-24 h-24 rounded-full object-cover border-4 border-orange-500"
          />
          <label className="absolute bottom-0 right-0 bg-orange-500 p-2 rounded-full cursor-pointer">
            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
            📸
          </label>
        </div>

        {/* Hiển thị tên tài khoản Pi (username) */}
        <h1 className="text-center text-lg font-semibold text-gray-800 mb-4">
          @{user.username}
        </h1>

        <div className="space-y-4">
          {/* Biệt danh */}
          <div>
            <label className="block text-sm text-gray-700">Tên biệt danh trong app</label>
            <input
              className="w-full border px-3 py-2 rounded"
              value={info.appName}
              onChange={(e) => setInfo({ ...info, appName: e.target.value })}
              placeholder="Nhập biệt danh tùy chọn"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm text-gray-700">Email</label>
            <input
              className="w-full border px-3 py-2 rounded"
              value={info.email}
              onChange={(e) => setInfo({ ...info, email: e.target.value })}
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm text-gray-700">Số điện thoại</label>
            <div className="flex">
              <span className="px-3 py-2 bg-gray-100 border rounded-l">
                {info.phoneCode}
              </span>
              <input
                className="flex-1 border px-3 py-2 rounded-r"
                value={info.phone}
                onChange={(e) => setInfo({ ...info, phone: e.target.value })}
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm text-gray-700">Địa chỉ</label>
            <textarea
              className="w-full border px-3 py-2 rounded h-20"
              value={info.address}
              onChange={(e) => setInfo({ ...info, address: e.target.value })}
            />
          </div>

          {/* Country */}
          <div>
            <label className="block text-sm text-gray-700">Quốc gia</label>
            <select
              className="w-full border px-3 py-2 rounded"
              value={info.country}
              onChange={(e) => {
                const c = countries.find((x) => x.code === e.target.value);
                setInfo({ ...info, country: e.target.value, phoneCode: c?.dial || "+00", province: "" });
              }}
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
            <label className="block text-sm text-gray-700">Tỉnh / Thành phố</label>
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

        <button
          onClick={handleSave}
          className="w-full mt-6 bg-green-500 text-white py-2 rounded"
        >
          💾 Lưu thay đổi
        </button>

      </div>
    </main>
  );
}
