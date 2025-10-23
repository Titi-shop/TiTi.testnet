"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function CustomerAddressPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    country: "Vietnam",
    countryCode: "+84",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // 🌍 Danh sách quốc gia + mã vùng
  const countries = [
    { name: "Vietnam", code: "+84" },
    { name: "Thailand", code: "+66" },
    { name: "Philippines", code: "+63" },
    { name: "Indonesia", code: "+62" },
    { name: "Malaysia", code: "+60" },
    { name: "Singapore", code: "+65" },
    { name: "India", code: "+91" },
    { name: "United States", code: "+1" },
    { name: "Canada", code: "+1" },
    { name: "United Kingdom", code: "+44" },
    { name: "Australia", code: "+61" },
  ];

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
    try {
      const res = await fetch(`/api/address?username=${u}`);
      const data = await res.json();
      if (data?.address) setForm(data.address);
    } catch (err) {
      console.error("❌ Lỗi tải địa chỉ:", err);
    }
  };

  // ✅ Khi chọn quốc gia thì cập nhật mã vùng tự động
  const handleCountryChange = (e: any) => {
    const selected = countries.find((c) => c.name === e.target.value);
    setForm({
      ...form,
      country: selected?.name || "Vietnam",
      countryCode: selected?.code || "+84",
    });
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
      localStorage.setItem("shipping_info", JSON.stringify(form)); // 🔹 lưu tạm local
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

      {/* Quốc gia */}
      <label className="block mb-2 font-medium">🌍 Quốc gia</label>
      <select
        className="border p-2 w-full rounded mb-3"
        value={form.country}
        onChange={handleCountryChange}
      >
        {countries.map((c) => (
          <option key={c.name} value={c.name}>
            {c.name} ({c.code})
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

      {/* Nút hành động */}
      <div className="flex flex-col gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className={`w-full py-3 rounded text-white font-semibold ${
            saving ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {saving ? "Đang lưu..." : "💾 Lưu địa chỉ"}
        </button>

        <button
          onClick={() => router.push("/checkout")}
          className="w-full py-3 rounded text-blue-600 border border-blue-600 hover:bg-blue-50 font-semibold"
        >
          ⬅️ Quay lại thanh toán
        </button>
      </div>

      {message && (
        <p className="mt-3 text-center text-sm text-gray-700">{message}</p>
      )}
    </main>
  );
}
