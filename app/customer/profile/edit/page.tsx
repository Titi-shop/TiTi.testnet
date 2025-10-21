"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "../../../context/LanguageContext";

export default function EditProfilePage() {
  const router = useRouter();
  const { lang, translate } = useLanguage();

  const [info, setInfo] = useState({
    username: "",
    email: "",
    phone: "",
    address: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("user_info");
    if (stored) {
      const parsed = JSON.parse(stored);
      setInfo({
        username: parsed.username || "",
        email: parsed.email || "",
        phone: parsed.phone || "",
        address: parsed.address || "",
      });

      fetch(`/api/profile?username=${parsed.username}`)
        .then((res) => res.json())
        .then((data) => {
          if (data?.username) setInfo(data);
        })
        .catch(() => console.log("Không thể tải dữ liệu hồ sơ"));
    }
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(info),
    });

    const data = await res.json();
    setSaving(false);

    if (data.success) {
      localStorage.setItem("user_info", JSON.stringify(info));
      alert("✅ " + (translate("profile_saved") || "Đã lưu hồ sơ thành công!"));
      router.push("/customer/profile");
    } else {
      alert("❌ " + (translate("save_failed") || "Lưu thất bại!"));
    }
  };

  return (
    <main className="p-4 max-w-md mx-auto">
      <h1 className="text-xl font-bold text-orange-600 mb-4">
        👤 {translate("edit_profile")}
      </h1>

      <div className="space-y-4">
        {[
          ["username", translate("username")],
          ["email", translate("email")],
          ["phone", translate("phone")],
          ["address", translate("address")],
        ].map(([field, label]) => (
          <div key={field}>
            <label className="block text-sm text-gray-700">{label}</label>
            {field === "address" ? (
              <textarea
                value={info[field as keyof typeof info]}
                onChange={(e) =>
                  setInfo({ ...info, [field]: e.target.value })
                }
                className="w-full border px-3 py-2 rounded h-20"
              />
            ) : (
              <input
                type="text"
                value={info[field as keyof typeof info]}
                onChange={(e) =>
                  setInfo({ ...info, [field]: e.target.value })
                }
                className="w-full border px-3 py-2 rounded"
              />
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-between mt-6">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded"
        >
          {saving ? "Đang lưu..." : `💾 ${translate("save")}`}
        </button>

        <button
          onClick={() => router.push("/customer/profile")}
          className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-5 py-2 rounded"
        >
          ← {translate("back")}
        </button>
      </div>
    </main>
  );
}
