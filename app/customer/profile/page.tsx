"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "../../context/LanguageContext";

export default function ProfilePage() {
  const router = useRouter();
  const { lang, setLang, translate } = useLanguage();

  const [info, setInfo] = useState({
    username: "",
    email: "",
    phone: "",
    address: "",
  });

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // 🔹 Lấy thông tin từ localStorage + API KV
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
        .catch((err) => console.error("❌ Lỗi tải hồ sơ:", err));
    }
  }, []);

  // 💾 Lưu hồ sơ
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
      alert(translate("profile_saved") || "✅ Hồ sơ đã lưu thành công!");
      localStorage.setItem("user_info", JSON.stringify(info));
      setEditing(false);
    } else {
      alert(translate("save_failed") || "❌ Lưu thất bại!");
    }
  };

  // 🌐 Chuyển ngôn ngữ
  const toggleLang = () => {
    const next = lang === "vi" ? "zh" : "vi";
    setLang(next);
  };

  return (
    <main className="p-4 max-w-md mx-auto">
      {/* 🔹 Tiêu đề + chọn ngôn ngữ */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold text-orange-600">
          👤 {translate("profile")}
        </h1>
        <button
          onClick={toggleLang}
          className="text-sm bg-gray-200 hover:bg-gray-300 rounded px-2 py-1"
        >
          🌐 {lang === "vi" ? "中文" : "Tiếng Việt"}
        </button>
      </div>

      {/* 🔹 Form thông tin */}
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
                readOnly={!editing}
                onChange={(e) =>
                  setInfo({ ...info, [field]: e.target.value })
                }
                className={`w-full border px-3 py-2 rounded h-20 ${
                  editing ? "bg-white" : "bg-gray-100"
                }`}
              />
            ) : (
              <input
                type="text"
                value={info[field as keyof typeof info]}
                readOnly={!editing}
                onChange={(e) =>
                  setInfo({ ...info, [field]: e.target.value })
                }
                className={`w-full border px-3 py-2 rounded ${
                  editing ? "bg-white" : "bg-gray-100"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* 🔹 Các nút thao tác */}
      <div className="flex justify-between mt-6">
        {editing ? (
          <>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
            >
              {saving ? translate("saving") || "Đang lưu..." : `💾 ${translate("save")}`}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded"
            >
              ❌ {translate("cancel")}
            </button>
          </>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded"
          >
            ✏️ {translate("edit_profile")}
          </button>
        )}
        <button
          onClick={() => router.back()}
          className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded"
        >
          ← {translate("back")}
        </button>
      </div>
    </main>
  );
}
