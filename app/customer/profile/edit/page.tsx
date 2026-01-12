"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

  const [username, setUsername] = useState<string | null>(null);

  const [info, setInfo] = useState<ProfileInfo>({
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
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  /* ===============================
     1️⃣ LẤY USERNAME (KHÔNG AUTH)
  =============================== */
  useEffect(() => {
    const direct = localStorage.getItem("titi_username");
    if (direct) {
      setUsername(direct);
      return;
    }

    try {
      const raw = localStorage.getItem("pi_user");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.username) {
          setUsername(parsed.username);
          return;
        }
      }
    } catch {}

    setUsername(null);
    setLoading(false);
  }, []);

  /* ===============================
     2️⃣ LOAD PROFILE THEO USERNAME
  =============================== */
  useEffect(() => {
    if (!username) return;

    fetch(`/api/profile?username=${encodeURIComponent(username)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data) return;

        const countryCode = data.country || "VN";
        const countryData = countries.find((c) => c.code === countryCode);

        setInfo({
          pi_uid: data.pi_uid || "",
          appName: data.appName || data.displayName || username,
          email: data.email || "",
          phone: data.phone || "",
          address: data.address || "",
          province: data.province || "",
          country: countryCode,
          phoneCode: countryData?.dial || "+84",
        });

        if (data.avatar) setAvatar(data.avatar);
      })
      .catch(() => console.warn("⚠️ Không thể tải hồ sơ"))
      .finally(() => setLoading(false));
  }, [username]);

  /* ===============================
     3️⃣ UPLOAD AVATAR (OPTIONAL)
  =============================== */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatar(URL.createObjectURL(file));
    // 👉 nếu có API upload riêng thì xử lý ở đây
  };

  /* ===============================
     4️⃣ SAVE PROFILE
  =============================== */
  const handleSave = async () => {
    if (!username) {
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...info,
          username,
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

  const provinceList = provincesByCountry[info.country] || [];

  /* ===============================
     UI STATES
  =============================== */
  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">{t.loading_profile}</p>
      </main>
    );
  }

  if (!username) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">{t.profile_error_not_logged_in}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 pb-32 relative">
      {/* BACK */}
      <button
        onClick={() => router.back()}
        className="absolute top-3 left-3 text-orange-600 text-lg font-bold"
      >
        ←
      </button>

      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg mt-12 p-6">
        {/* AVATAR */}
        <div className="relative w-24 h-24 mx-auto mb-4">
          <img
            src={avatar || `/api/getAvatar?username=${username}`}
            className="w-24 h-24 rounded-full object-cover border-4 border-orange-500"
          />
          <label className="absolute bottom-0 right-0 bg-orange-500 p-2 rounded-full cursor-pointer">
            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
            📸
          </label>
        </div>

        <h1 className="text-center text-lg font-semibold mb-4">@{username}</h1>

        {/* FORM */}
        <div className="space-y-4">
          <input
            className="w-full border px-3 py-2 rounded"
            value={info.appName}
            onChange={(e) => setInfo({ ...info, appName: e.target.value })}
            placeholder={t.app_name}
          />

          <input
            type="email"
            className="w-full border px-3 py-2 rounded"
            value={info.email}
            onChange={(e) => setInfo({ ...info, email: e.target.value })}
            placeholder={t.email}
          />

          <textarea
            className="w-full border px-3 py-2 rounded h-20"
            value={info.address}
            onChange={(e) => setInfo({ ...info, address: e.target.value })}
            placeholder={t.address}
          />

          <select
            className="w-full border px-3 py-2 rounded"
            value={info.country}
            onChange={(e) => {
              const c = countries.find((x) => x.code === e.target.value);
              setInfo({
                ...info,
                country: e.target.value,
                phoneCode: c?.dial || "+84",
                province: "",
              });
            }}
          >
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.name}
              </option>
            ))}
          </select>

          <select
            className="w-full border px-3 py-2 rounded"
            value={info.province}
            onChange={(e) => setInfo({ ...info, province: e.target.value })}
          >
            <option value="">{t.select_option}</option>
            {provinceList.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </div>

        {/* SAVE */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-6 w-full bg-green-500 text-white py-2 rounded"
        >
          {saving ? t.saving : t.save_changes}
        </button>
      </div>
    </main>
  );
}
