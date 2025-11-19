"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { countries } from "@/data/countries";
import { useAuth } from "@/context/AuthContext";

export default function CustomerAddressPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [addresses, setAddresses] = useState<any[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    country: "VN",
    countryCode: "+84",
    isDefault: false,
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // 📌 Load danh sách địa chỉ
  useEffect(() => {
    if (loading || !user) return;

    fetch(`/api/address?username=${user.username}`)
      .then((res) => res.json())
      .then((data) => setAddresses(data?.addresses || []))
      .catch(() => console.error("❌ Lỗi tải địa chỉ"));
  }, [user, loading]);

  // 📝 Đổi quốc gia trong form
  const handleCountryChange = (e: any) => {
    const selected = countries.find((c) => c.code === e.target.value);
    if (selected) {
      setForm({
        ...form,
        country: selected.code,
        countryCode: selected.dial,
      });
    }
  };

  // 💾 Lưu địa chỉ (Thêm hoặc Sửa)
  const handleSave = async () => {
    if (!form.name || !form.phone || !form.address) {
      setMessage("⚠️ Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    let updatedList = [...addresses];

    if (form.isDefault) {
      updatedList = updatedList.map((a) => ({ ...a, isDefault: false }));
    }

    if (editingIndex !== null) {
      updatedList[editingIndex] = { ...form };
    } else {
      updatedList.push({ ...form });
    }

    setSaving(true);
    const res = await fetch("/api/address", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: user?.username, addresses: updatedList }),
    });

    const data = await res.json();
    if (data.success) {
      setAddresses(updatedList);
      setForm({
        name: "",
        phone: "",
        address: "",
        country: "VN",
        countryCode: "+84",
        isDefault: false,
      });
      setEditingIndex(null);
      setShowForm(false);
      setMessage("✅ Đã lưu địa chỉ!");
    } else {
      setMessage("❌ Lưu thất bại!");
    }
    setSaving(false);
  };

  // ✏️ Chỉnh sửa địa chỉ
  const handleEdit = (index: number) => {
    setForm({ ...addresses[index] });
    setEditingIndex(index);
    setShowForm(true);
  };

  // 🗑 Xoá địa chỉ
  const handleDelete = (index: number) => {
    const updatedList = addresses.filter((_, i) => i !== index);
    setAddresses(updatedList);
    fetch("/api/address", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: user?.username, addresses: updatedList }),
    });
  };

  // ⭐ Chọn làm mặc định
  const setDefault = (index: number) => {
    const updated = addresses.map((a, i) => ({
      ...a,
      isDefault: i === index,
    }));
    setAddresses(updated);
    fetch("/api/address", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: user?.username, addresses: updated }),
    });
  };

  // UI Loading hoặc chưa login
  if (loading) {
    return <main className="min-h-screen flex items-center justify-center">⏳</main>;
  }

  if (!user) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center">
        <p>Bạn cần đăng nhập để tiếp tục.</p>
        <button onClick={() => router.push("/login")} className="bg-orange-500 text-white px-5 py-2 rounded">
          Đăng nhập
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 pb-20 relative">

      {/* 🔙 Nút quay lại */}
      <button
        onClick={() => router.back()}
        className="absolute top-3 left-3 text-orange-600 text-lg font-bold"
      >
        ←
      </button>

      <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow mt-14">
        <h1 className="text-2xl font-bold text-center text-orange-600 mb-4">
          📦 Địa chỉ giao hàng
        </h1>

        {/* 📋 Danh sách địa chỉ */}
        {addresses.length > 0 && (
          <div className="mb-6">
            <h2 className="font-semibold mb-2 text-lg">📦 Địa chỉ đã lưu:</h2>
            <ul className="space-y-3">
              {addresses.map((item, index) => (
                <li
                  key={index}
                  className="border p-3 rounded relative bg-gray-50 shadow-sm"
                >
                  {item.isDefault && (
                    <span className="absolute top-2 right-2 text-orange-600 text-xs border px-2 py-1 rounded">
                      Mặc định
                    </span>
                  )}

                  <p><b>👤 {item.name}</b></p>
                  <p>📞 {item.countryCode} {item.phone}</p>
                  <p>🏠 {item.address}</p>
                  <p>🌍 {countries.find((c) => c.code === item.country)?.name}</p>

                  <div className="flex gap-2 mt-2 text-sm">
                    <button onClick={() => handleEdit(index)} className="px-3 py-1 bg-orange-500 text-white rounded">
                      Sửa
                    </button>
                    <button onClick={() => handleDelete(index)} className="px-3 py-1 bg-orange-600 text-white rounded">
                      Xoá
                    </button>
                    {!item.isDefault && (
                      <button onClick={() => setDefault(index)} className="px-3 py-1 bg-orange-700 text-white rounded">
                        Chọn mặc định
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ➕ Chỉ hiện nút thêm địa chỉ khi chưa bật form */}
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="w-full py-3 bg-orange-500 text-white font-semibold rounded mb-4"
          >
            ➕ Thêm địa chỉ mới
          </button>
        )}

        {/* 📄 Form thêm / sửa địa chỉ */}
        {showForm && (
          <>
            <h2 className="text-lg font-semibold mb-3">
              {editingIndex !== null ? "✏️ Cập nhật địa chỉ" : "➕ Thêm địa chỉ mới"}
            </h2>

            {/* Country */}
            <label className="block font-medium">🌍 Quốc gia</label>
            <select
              className="border p-2 w-full rounded mb-3"
              value={form.country}
              onChange={handleCountryChange}
            >
              {countries.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.name} ({c.dial})
                </option>
              ))}
            </select>

            {/* Họ tên */}
            <label className="block font-medium">👤 Họ và tên</label>
            <input className="border p-2 w-full rounded mb-3" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} />

            {/* Phone */}
            <label className="block font-medium">📞 Số điện thoại</label>
            <div className="flex mb-3">
              <span className="px-3 py-2 bg-gray-100 border rounded-l">{form.countryCode}</span>
              <input className="border p-2 w-full rounded-r" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})}/>
            </div>

            {/* Address */}
            <label className="block font-medium">🏠 Địa chỉ</label>
            <textarea className="border p-2 w-full rounded mb-4" rows={3} value={form.address} onChange={(e) => setForm({...form, address: e.target.value})}/>

            {/* Checkbox mặc định */}
            <label className="flex items-center gap-2 mb-3">
              <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({...form, isDefault: e.target.checked})}/>
              Đặt làm địa chỉ mặc định
            </label>

            {/* Buttons */}
            <button onClick={handleSave} disabled={saving} className="w-full py-3 rounded bg-orange-600 text-white font-semibold mb-2">
              {saving ? "Đang lưu..." : "💾 Lưu địa chỉ"}
            </button>
            <button onClick={() => { setShowForm(false); setEditingIndex(null); }} className="w-full py-3 rounded bg-gray-300 font-semibold">
              Hủy
            </button>
          </>
        )}

        {message && <p className="mt-3 text-center text-sm text-gray-700">{message}</p>}
      </div>
    </main>
  );
}
