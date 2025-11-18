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
    appName: "",
    email: "",
    phoneCode: "+00",
    phone: "",
    address: "",
    province: "",
    country: "VN",
  });

  const [avatar, setAvatar] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !user) return;

    fetch(`/api/profile?username=${user.username}`)
      .then((res) => res.json())
      .then((data) => {
        const cc = data.country || "VN";
        const countryData = countries.find((c) => c.code === cc);

        setInfo({
          appName: data.appName || "",
          email: data.email || "",
          phone: data.phone || "",
          address: data.address || "",
          province: data.province || "",
          country: cc,
          phoneCode: countryData?.dial || "+00",
        });

        if (data.avatar) setAvatar(data.avatar);
      });
  }, [authLoading, user]);

  const handleSave = async () => {
    const body = {
      ...info,
      username: user.username,
      avatar,
    };

    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (data.success) {
      alert("Đã lưu!");
      router.push("/customer/profile");
    } else alert("Lỗi lưu dữ liệu");
  };

  const provinceList = provincesByCountry[info.country] || [];

  return (
    <main className="min-h-screen bg-gray-100 pb-32 relative">

      <button
        onClick={() => router.back()}
        className="absolute top-3 left-3 text-orange-600 text-lg font-bold"
      >
        ←
      </button>

      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg mt-12 p-6">

        {/* avatar */}
        <div className="relative w-24 h-24 mx-auto mb-4">
          <img
            src={avatar || "/default-avatar.png"}
            className="w-24 h-24 rounded-full object-cover border-4 border-orange-500"
          />
        </div>

        {/* Tên Pi thật */}
        <h1 className="text-center text-lg font-semibold mb-4">{user.displayName}</h1>

        <div className="space-y-4">

          {/* Biệt danh */}
          <div>
            <label className="block text-sm">Biệt danh</label>
            <input
              className="w-full border px-3 py-2 rounded"
              value={info.appName}
              onChange={(e) => setInfo({ ...info, appName: e.target.value })}
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm">Email</label>
            <input
              className="w-full border px-3 py-2 rounded"
              value={info.email}
              onChange={(e) => setInfo({ ...info, email: e.target.value })}
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm">Số điện thoại</label>
            <div className="flex">
              <span className="px-3 py-2 border rounded-l bg-gray-100">
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
            <label className="block text-sm">Địa chỉ</label>
            <textarea
              className="w-full border px-3 py-2 rounded h-20"
              value={info.address}
              onChange={(e) => setInfo({ ...info, address: e.target.value })}
            />
          </div>

          {/* Country */}
          <div>
            <label className="block text-sm">Quốc gia</label>
            <select
              className="w-full border px-3 py-2 rounded"
              value={info.country}
              onChange={(e) => {
                const c = countries.find((x) => x.code === e.target.value);
                setInfo({
                  ...info,
                  country: e.target.value,
                  phoneCode: c?.dial || "+00",
                  province: "",
                });
              }}
            >
              {countries.map((c) => (
                <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
              ))}
            </select>
          </div>

          {/* Province */}
          <div>
            <label className="block text-sm">Tỉnh / Thành phố</label>
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
          Lưu thay đổi
        </button>

      </div>
    </main>
  );
}
