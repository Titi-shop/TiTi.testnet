"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "../../../context/LanguageContext";

export default function EditProfilePage() {
  const router = useRouter();
  const { translate } = useLanguage();

  const [piAccount, setPiAccount] = useState<any>(null);
  const [info, setInfo] = useState({
    pi_uid: "",
    displayName: "",
    email: "",
    phone: "",
    address: "",
  });
  const [saving, setSaving] = useState(false);

  // 🔸 Lấy thông tin Pi và hồ sơ phụ
  useEffect(() => {
    const stored = localStorage.getItem("pi_account");
    if (stored) {
      const parsed = JSON.parse(stored);
      setPiAccount(parsed);

      fetch(`/api/profile?pi_uid=${parsed.pi_uid}`)
        .then((res) => res.json())
        .then((data) => {
          setInfo({
            pi_uid: parsed.pi_uid,
            displayName: data?.displayName || "",
            email: data?.email || "",
            phone: data?.phone || "",
            address: data?.address || "",
          });
        })
        .catch(() => console.log("Không thể tải hồ sơ"));
    }
  }, []);

  // 🔸 Lưu hồ sơ phụ
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
      alert("✅ " + (translate("profile_saved") || "Đã lưu hồ sơ thành công!"));
      router.push("/customer/profile");
    } else {
      alert("❌ " + (translate("save_failed") || "Lưu thất bại!"));
    }
  };

  if (!piAccount) return <p className="p-4">🔄 Đang tải...</p>;

  return (
    <main className="p-4 max-w-md mx-auto">
      <h1 className="text-xl font-bold text-orange-600 mb-4">
        👤 {translate("edit_profile")}
      </h1>

      {/* Tài khoản Pi (không cho sửa) */}
      <div className="bg-gray-100 border p-3 rounded mb-4">
        <p><strong>Tài khoản Pi:</strong> {piAccount.pi_username}</p>
        <p className="text-xs text-gray-500">UID: {piAccount.pi_uid}</p>
      </div>

      {/* Thông tin phụ */}
      <div className="space-y-4">
        {[
          ["displayName", "Tên hiển thị"],
          ["email", "Email"],
          ["phone", "Số điện thoại"],
          ["address", "Địa chỉ giao hàng"],
        ].map(([field, label]) => (
          <div key={field}>
            <label className="block text-sm text-gray-700 mb-1">{label}</label>
            {field === "address" ? (
              <textarea
                value={info[field as keyof typeof info]}
                onChange={(e) => setInfo({ ...info, [field]: e.target.value })}
                className="w-full border px-3 py-2 rounded h-20"
              />
            ) : (
              <input
                type="text"
                value={info[field as keyof typeof info]}
                onChange={(e) => setInfo({ ...info, [field]: e.target.value })}
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
          {saving ? "Đang lưu..." : "💾 Lưu hồ sơ"}
        </button>

        <button
          onClick={() => router.push("/customer/profile")}
          className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-5 py-2 rounded"
        >
          ← Quay lại
        </button>
      </div>
    </main>
  );
}
