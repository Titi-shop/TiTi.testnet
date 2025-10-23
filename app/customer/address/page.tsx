"use client";

import { useEffect, useState } from "react";

export default function CustomerAddressPage() {
  const [username, setUsername] = useState("");
  const [form, setForm] = useState({ name: "", phone: "", address: "" });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // ✅ Lấy username từ localStorage
  useEffect(() => {
    const user = localStorage.getItem("titi_username");
    if (user) {
      setUsername(user);
      fetchAddress(user);
    }
  }, []);

  // ✅ Lấy địa chỉ đã lưu
  const fetchAddress = async (u: string) => {
    const res = await fetch(`/api/address?username=${u}`);
    const data = await res.json();
    if (data?.address) setForm(data.address);
  };

  // ✅ Gửi địa chỉ lên server
  const handleSave = async () => {
    if (!form.name || !form.phone || !form.address) {
      setMessage("⚠️ Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    setSaving(true);
    const res = await fetch("/api/address", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, ...form }),
    });

    const data = await res.json();
    if (data.success) {
      setMessage("✅ Đã lưu địa chỉ thành công!");
    } else {
      setMessage("❌ Lưu thất bại!");
    }
    setSaving(false);
  };

  return (
    <main className="max-w-md mx-auto p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold text-center text-blue-600 mb-4">
        📍 Địa chỉ giao hàng
      </h1>

      <label className="block mb-2 font-medium">👤 Họ và tên</label>
      <input
        className="border p-2 w-full rounded mb-3"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
      />

      <label className="block mb-2 font-medium">📞 Số điện thoại</label>
      <input
        className="border p-2 w-full rounded mb-3"
        value={form.phone}
        onChange={(e) => setForm({ ...form, phone: e.target.value })}
      />

      <label className="block mb-2 font-medium">🏠 Địa chỉ</label>
      <textarea
        className="border p-2 w-full rounded mb-4"
        rows={3}
        value={form.address}
        onChange={(e) => setForm({ ...form, address: e.target.value })}
      />

      <button
        onClick={handleSave}
        disabled={saving}
        className={`w-full py-3 rounded text-white font-semibold ${
          saving ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {saving ? "Đang lưu..." : "💾 Lưu địa chỉ"}
      </button>

      {message && <p className="mt-3 text-center text-sm text-gray-700">{message}</p>}
    </main>
  );
}
