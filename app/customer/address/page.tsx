"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { countries } from "@/data/countries";
import { phoneRules } from "@/data/phoneRules";

export default function CustomerAddressPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    country: "",
    countryCode: "",
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // 🔍 Lấy username và load địa chỉ
  useEffect(() => {
    const u = localStorage.getItem("titi_username");

    if (u) {
      setUsername(u);
      fetchAddress(u);
    } else {
      const first = countries[0];
      setForm((prev) => ({
        ...prev,
        country: first.code,
        countryCode: first.dial,
      }));
    }
  }, []);

  // 📌 Load địa chỉ từ API
  const fetchAddress = async (u: string) => {
    try {
      const res = await fetch(`/api/address?username=${u}`);
      const data = await res.json();

      if (data?.address) {
        const saved = data.address;

        // 🔥 tự động sửa mã vùng nếu thiếu
        const countryData = countries.find((c) => c.code === saved.country);

        setForm({
          ...saved,
          countryCode: countryData ? countryData.dial : "+00",
        });
      } else {
        const first = countries[0];
        setForm({
          name: "",
          phone: "",
          address: "",
          country: first.code,
          countryCode: first.dial,
        });
      }
    } catch (err) {
      console.error("❌ Lỗi tải địa chỉ:", err);
    }
  };

  // 🌍 Khi chọn quốc gia
  const handleCountryChange = (e: any) => {
    const code = e.target.value;
    const selected = countries.find((c) => c.code === code);
    if (!selected) return;

    setForm({
      ...form,
      country: selected.code,
      countryCode: selected.dial,
    });
  };

  // 🧪 Validate số điện thoại
  const validatePhone = () => {
    const rule = phoneRules[form.country];
    if (!rule) return true;
    return rule.regex.test(form.phone);
  };

  // 💾 Lưu địa chỉ
  const handleSave = async () => {
    if (!form.name || !form.phone || !form.address) {
      setMessage("⚠️ Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    // 🔥 kiểm tra số điện thoại theo quốc gia
    if (!validatePhone()) {
      setMessage("❌ Số điện thoại không đúng định dạng của quốc gia!");
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
      localStorage.setItem("shipping_info", JSON.stringify(form));
    } else {
      setMessage("❌ Lưu thất bại!");
    }

    setSaving(false);
  };

  return (
    <main className="min-h-screen bg-gray-100 pb-20 relative">

      {/* Nút quay lại */}
      <button
        onClick={() => router.back()}
        className="absolute top-3 left-3 z-50 bg-orange-500 text-white px-3 py-1 rounded-full shadow font-bold text-lg"
      >
        ←
      </button>

      <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow mt-14">
        <h1 className="text-2xl font-bold text-center text-orange-600 mb-4">
          📍 Địa chỉ giao hàng
        </h1>

        {/* Quốc gia */}
        <label className="block mb-2 font-medium">🌍 Quốc gia</label>
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

        {/* Họ và tên */}
        <label className="block mb-2 font-medium">👤 Họ và tên</label>
        <input
          className="border p-2 w-full rounded mb-3"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        {/* Số điện thoại */}
        <label className="block mb-2 font-medium">📞 Số điện thoại</label>
        <div className="flex mb-3">
          <span className="px-3 py-2 bg-gray-100 border rounded-l">
            {form.countryCode}
          </span>
          <input
            type="tel"
            className="border p-2 w-full rounded-r"
            placeholder="Nhập số điện thoại"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </div>

        {/* Địa chỉ */}
        <label className="block mb-2 font-medium">🏠 Địa chỉ</label>
        <textarea
          className="border p-2 w-full rounded mb-4"
          rows={3}
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
        />

        {/* Nút lưu */}
        <button
          onClick={handleSave}
          disabled={saving}
          className={`w-full py-3 rounded text-white font-semibold ${
            saving ? "bg-gray-400" : "bg-orange-600 hover:bg-orange-700"
          }`}
        >
          {saving ? "Đang lưu..." : "💾 Lưu địa chỉ"}
        </button>

        {message && (
          <p className="mt-3 text-center text-sm text-gray-700">{message}</p>
        )}
      </div>
    </main>
  );
}
