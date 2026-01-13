"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { countries } from "@/data/countries";
import { provincesByCountry } from "@/data/provinces";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";
import { useAuth } from "@/context/AuthContext";

interface ProfileInfo {
  displayName: string;
  email: string;
  phone: string;
  address: string;
  province: string;
  country: string;
}

export default function EditProfilePage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();

  const [info, setInfo] = useState<ProfileInfo>({
    displayName: "",
    email: "",
    phone: "",
    address: "",
    province: "",
    country: "VN",
  });

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  /* =========================
     LOAD PROFILE (AUTH-CENTRIC)
  ========================= */
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      alert(t.profile_error_not_logged_in);
      router.push("/account");
      return;
    }

    fetch("/api/profile", {
      credentials: "include",
      cache: "no-store",
    })
      .then((r) => r.json())
      .then((data) => {
        setInfo({
          displayName: data.displayName || "",
          email: data.email || "",
          phone: data.phone || "",
          address: data.address || "",
          province: data.province || "",
          country: data.country || "VN",
        });
      })
      .finally(() => setLoading(false));
  }, [user, authLoading, router, t]);

  /* =========================
     SAVE PROFILE
  ========================= */
  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(info),
      });

      const data = await res.json();
      if (data.success) {
        alert(t.profile_saved);
        router.push("/customer/profile");
      } else {
        alert(data.error || t.save_error);
      }
    } catch {
      alert(t.save_error);
    } finally {
      setSaving(false);
    }
  };

  const provinceList = provincesByCountry[info.country] || [];

  /* =========================
     UI
  ========================= */
  if (loading || authLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p>{t.loading_profile}</p>
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
        <h1 className="text-center text-lg font-semibold mb-4">
          @{user?.username}
        </h1>

        <div className="space-y-4">
          <input
            className="w-full border px-3 py-2 rounded"
            value={info.displayName}
            onChange={(e) =>
              setInfo({ ...info, displayName: e.target.value })
            }
            placeholder={t.app_name}
          />

          <input
            type="email"
            className="w-full border px-3 py-2 rounded"
            value={info.email}
            onChange={(e) =>
              setInfo({ ...info, email: e.target.value })
            }
            placeholder={t.email}
          />

          <textarea
            className="w-full border px-3 py-2 rounded h-20"
            value={info.address}
            onChange={(e) =>
              setInfo({ ...info, address: e.target.value })
            }
            placeholder={t.address}
          />

          <select
            className="w-full border px-3 py-2 rounded"
            value={info.country}
            onChange={(e) =>
              setInfo({
                ...info,
                country: e.target.value,
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

          <select
            className="w-full border px-3 py-2 rounded"
            value={info.province}
            onChange={(e) =>
              setInfo({ ...info, province: e.target.value })
            }
          >
            <option value="">{t.select_option}</option>
            {provinceList.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </div>

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
