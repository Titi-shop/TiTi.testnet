"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { countries } from "@/data/countries";
import { useAuth } from "@/context/AuthContext";

interface Address {
  name: string;
  phone: string;
  address: string;
  country: string;
  countryCode: string;
  isDefault: boolean;
}

export default function CustomerAddressPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [formVisible, setFormVisible] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Form mặc định
  const [form, setForm] = useState<Address>({
    name: "",
    phone: "",
    address: "",
    country: "VN",
    countryCode: "+84",
    isDefault: false,
  });

  /**
   * 🟢 Load dữ liệu khi login
   */
  useEffect(() => {
    if (loading || !user) return;

    try {
      const local = localStorage.getItem(`addresses_${user.username}`);
      if (local) {
        setAddresses(JSON.parse(local));
      } else {
        fetchFromAPI(user.username);
      }
    } catch (err) {
      console.error("Lỗi JSON localStorage:", err);
    }
  }, [user, loading]);

  /**
   * 🔹 Fetch API khi chưa có localStorage
   */
  const fetchFromAPI = async (username: string) => {
    try {
      const res = await fetch(`/api/address?username=${username}`);
      const data = await res.json();

      // API trả về dạng object, không phải list
      if (data?.address) {
        const saved = data.address;
        setAddresses([
          {
            ...saved,
            isDefault: true,
            country: saved.country || "VN",
            countryCode:
              countries.find((c) => c.code === saved.country)?.dial || "+84",
          },
        ]);
      }
    } catch (err) {
      console.error("Lỗi API:", err);
    }
  };

  /** 🔹 Lưu địa chỉ nhiều nhưng chỉ gửi địa chỉ mặc định lên server */
  const handleSave = async () => {
    if (!form.name || !form.phone || !form.address) {
      setMessage("⚠️ Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    let updated = [...addresses];
    if (form.isDefault) updated = updated.map((a) => ({ ...a, isDefault: false }));

    if (editingIndex !== null) updated[editingIndex] = { ...form };
    else updated.push({ ...form });

    setAddresses(updated);
    localStorage.setItem(`addresses_${user?.username}`, JSON.stringify(updated));
    setFormVisible(false);

    const defaultAddress = updated.find((a) => a.isDefault) || updated[0];

    setSaving(true);
    await fetch("/api/address", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: user?.username, ...defaultAddress }),
    });
    setSaving(false);
    setMessage("✅ Đã lưu thành công!");
  };

  /** 🟠 FIX CRASH — Bảo vệ khi chưa login */
  if (loading) return <p>⏳ Loading...</p>;
  if (!user) return <p>🔐 Bạn cần đăng nhập</p>;

  /**
   * ===========================
   * 🎯 RENDER UI AN TOÀN
   * ===========================
   */
  return (
    <main className="min-h-screen bg-gray-100 p-4">
      <button onClick={() => router.back()} className="text-orange-600 mb-3">
        ← Quay lại
      </button>

      <h1 className="text-xl font-bold mb-4 text-orange-600">📍 Địa chỉ giao hàng</h1>

      {/* Danh sách địa chỉ */}
      {Array.isArray(addresses) &&
        addresses.map((item, index) => (
          <div key={index} className="bg-white p-4 rounded shadow mb-3 border">
            <p className="font-semibold">{item.name} — {item.phone}</p>
            <p className="text-sm">{item.address}</p>
            <p className="text-xs text-gray-500">
              🌍 {countries.find((c) => c.code === item.country)?.name} ({item.countryCode})
            </p>

            <div className="flex justify-between mt-3 text-sm">
              <button
                onClick={() => {
                  const updated = addresses.map((a, i) => ({
                    ...a,
                    isDefault: i === index,
                  }));
                  setAddresses(updated);
                  localStorage.setItem(`addresses_${user.username}`, JSON.stringify(updated));
                }}
                className={item.isDefault ? "text-orange-600 font-bold" : "text-gray-500"}
              >
                ✓ Mặc định
              </button>
              <div className="flex gap-4">
                <button
                  className="text-blue-500"
                  onClick={() => {
                    setForm(item);
                    setEditingIndex(index);
                    setFormVisible(true);
                  }}
                >
                  ✏️
                </button>
                <button
                  className="text-red-500"
                  onClick={() => {
                    const updated = addresses.filter((_, i) => i !== index);
                    setAddresses(updated);
                    localStorage.setItem(`addresses_${user.username}`, JSON.stringify(updated));
                  }}
                >
                  🗑
                </button>
              </div>
            </div>
          </div>
        ))}

      {/* Nút thêm địa chỉ */}
      {!formVisible && (
        <button
          onClick={() => {
            setFormVisible(true);
            setForm({
              name: "",
              phone: "",
              address: "",
              country: "VN",
              countryCode: "+84",
              isDefault: addresses.length === 0,
            });
          }}
          className="w-full py-3 bg-orange-600 text-white rounded"
        >
          ➕ Thêm địa chỉ mới
        </button>
      )}

      {/* Form nhập địa chỉ */}
      {formVisible && (
        <div className="bg-white p-4 rounded shadow mt-4">
          <select
            className="border p-2 w-full mb-3"
            value={form.country}
            onChange={(e) => {
              const code = e.target.value;
              const selected = countries.find((x) => x.code === code);
              setForm({
                ...form,
                country: code,
                countryCode: selected?.dial || "+84",
              });
            }}
          >
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.name} ({c.dial})
              </option>
            ))}
          </select>

          <input
            className="border p-2 w-full rounded mb-3"
            placeholder="Tên người nhận"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <div className="flex mb-3">
            <span className="px-3 py-2 bg-gray-200 border rounded-l">
              {form.countryCode}
            </span>
            <input
              className="border p-2 w-full rounded-r"
              placeholder="Số điện thoại"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>

          <textarea
            className="border p-2 w-full rounded mb-3"
            rows={3}
            placeholder="Địa chỉ chi tiết"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 bg-orange-600 text-white rounded"
          >
            {saving ? "⏳ Đang lưu..." : "💾 Lưu địa chỉ"}
          </button>
        </div>
      )}

      {message && <p className="mt-3 text-center">{message}</p>}
    </main>
  );
}
