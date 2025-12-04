"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { countries } from "@/data/countries";
import { provincesByCountry } from "@/data/provinces";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";

interface ProfileInfo {
  pi_uid: string;
  appName: string;
  email: string;
  phoneCode: string;
  phone: string;
  address: string;
  province: string;
  country: string;
}

export default function EditProfilePage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, loading: authLoading, piReady } = useAuth();

  const [info, setInfo] = useState<ProfileInfo>({
    pi_uid: "",
    appName: "",
    email: "",
    phoneCode: "+00",
    phone: "",
    address: "",
    province: "",
    country: "VN",
  });

  const [avatar, setAvatar] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  // 🟢 Load profile
  useEffect(() => {
    if (authLoading || !user) return;

    const username =
      user.username || localStorage.getItem("titi_username");

    fetch(`/api/profile?username=${encodeURIComponent(username!)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          const countryCode = data.country || "VN";
          const countryData = countries.find((c) => c.code === countryCode);

          setInfo((prev) => ({
            ...prev,
            pi_uid: data.pi_uid || "",
            appName: data.appName || data.displayName || username!,
            email: data.email || "",
            phone: data.phone || "",
            address: data.address || "",
            province: data.province || "",
            country: countryCode,
            phoneCode: countryData?.dial || "+00",
          }));

          if (data.avatar) setAvatar(data.avatar);
        }
      })
      .catch(() => console.log("⚠️ Không thể tải hồ sơ"));
  }, [authLoading, user]);

  // 📸 Preview avatar
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setAvatar(URL.createObjectURL(file));
    }
  };

  // 💾 Lưu hồ sơ
  const handleSave = async () => {
    if (!user) {
      alert(t.profile_error_not_logged_in);
      return;
    }

    const emailPattern =
      /^[a-zA-Z0-9._%+-]+@(?:gmail\.com|yahoo\.com|hotmail\.com|outlook\.com|icloud\.com|[\w.-]+\.\w{2,})$/;

    if (info.email && !emailPattern.test(info.email)) {
      alert(t.invalid_email);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.accessToken}`,
        },
        body: JSON.stringify({
          ...info,
          username: user.username,
          displayName: info.appName,
          avatar,
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert(t.profile_saved);
        router.push("/customer/profile");
      } else {
        alert(`${t.save_error}: ${data.error || ""}`);
      }
    } catch {
      alert(t.save_error);
    } finally {
      setSaving(false);
    }
  };

  const provinceList: string[] = provincesByCountry[info.country] || [];

  if (!piReady || authLoading || !user) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">{t.loading_profile}</p>
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

        <h1 className="text-center text-lg font-semibold text-gray-800 mb-4">
          {user?.username}
        </h1>

        <div className="space-y-4">

          {/* App Name */}
          <div>
            <label className="block text-sm text-gray-700 mb-1">{t.app_name}</label>
            <input
              type="text"
              className="w-full border px-3 py-2 rounded"
              value={info.appName}
              onChange={(e) => setInfo({ ...info, appName: e.target.value })}
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm text-gray-700 mb-1">{t.email}</label>
            <input
              type="email"
              className="w-full border px-3 py-2 rounded"
              value={info.email}
              onChange={(e) => setInfo({ ...info, email: e.target.value })}
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm text-gray-700 mb-1">{t.phone}</label>
            <div className="flex mb-1">
              <span className="px-3 py-2 bg-gray-100 border rounded-l">{info.phoneCode}</span>
              <input
                type="tel"
                className="flex-1 border px-3 py-2 rounded-r"
                value={info.phone}
                onChange={(e) => setInfo({ ...info, phone: e.target.value })}
                placeholder={t.enter_phone}
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm text-gray-700 mb-1">{t.address}</label>
            <textarea
              className="w-full border px-3 py-2 rounded h-20"
              value={info.address}
              onChange={(e) => setInfo({ ...info, address: e.target.value })}
            />
          </div>

          {/* Country */}
          <div>
            <label className="block text-sm text-gray-700 mb-1">{t.country}</label>
            <select
              className="w-full border px-3 py-2 rounded"
              value={info.country}
              onChange={(e) => {
                const newCountry = e.target.value;
                const c = countries.find((x) => x.code === newCountry);

                setInfo((prev) => ({
                  ...prev,
                  country: newCountry,
                  phoneCode: c?.dial || "+00",
                  province: "",
                }));
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
            <label className="block text-sm text-gray-700 mb-1">{t.province}</label>
            <select
              className="w-full border px-3 py-2 rounded"
              value={info.province}
              onChange={(e) => setInfo({ ...info, province: e.target.value })}
            >
              <option value="">{t.select_option}</option>
              {provinceList.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* SAVE */}
        <div className="flex flex-col mt-6 space-y-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-green-500 text-white py-2 rounded"
          >
            {saving ? t.saving : t.save_changes}
          </button>
        </div>
      </div>
    </main>
  );
}
