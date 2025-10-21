"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();
  const [info, setInfo] = useState({
    username: "",
    email: "",
    phone: "",
    address: "",
  });
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lang, setLang] = useState("vi");

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
      // Lấy hồ sơ từ server nếu có
      fetch(`/api/profile?username=${parsed.username}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.username) setInfo(data);
        });
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
      alert("✅ Hồ sơ đã lưu thành công!");
      setEditing(false);
      localStorage.setItem("user_info", JSON.stringify(info));
    } else alert("❌ Lưu thất bại!");
  };

  const toggleLang = () => {
    const next = lang === "vi" ? "zh" : "vi";
    setLang(next);
    router.push(`/${next}/customer/profile`);
  };

  return (
    <main className="p-4 max-w-md mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold text-orange-600">👤 Hồ sơ cá nhân</h1>
        <button
          onClick={toggleLang}
          className="text-sm bg-gray-200 hover:bg-gray-300 rounded px-2 py-1"
        >
          🌐 {lang === "vi" ? "中文" : "Tiếng Việt"}
        </button>
      </div>

      <div className="space-y-4">
        {["username", "email", "phone", "address"].map((field) => (
          <div key={field}>
            <label className="block text-sm text-gray-700 capitalize">
              {field === "username"
                ? "Tên người dùng"
                : field === "email"
                ? "Email"
                : field === "phone"
                ? "Số điện thoại"
                : "Địa chỉ"}
            </label>
            {field === "address" ? (
              <textarea
                value={info[field]}
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
                value={info[field]}
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

      <div className="flex justify-between mt-6">
        {editing ? (
          <>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
            >
              {saving ? "Đang lưu..." : "💾 Lưu"}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded"
            >
              ❌ Hủy
            </button>
          </>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded"
          >
            ✏️ Chỉnh sửa hồ sơ
          </button>
        )}
        <button
          onClick={() => router.back()}
          className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded"
        >
          ← Quay lại
        </button>
      </div>
    </main>
  );
}
