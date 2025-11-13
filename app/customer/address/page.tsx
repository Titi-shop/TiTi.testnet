"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { countries } from "@/data/countries";
import { useAuth } from "@/context/AuthContext";

export default function CustomerAddressPage() {
  const router = useRouter();
  const { user, loading } = useAuth(); // ✔ Không dùng autologin

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    country: "",
    countryCode: "",
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  /**
   * ================================
   *  1) LOAD ADDRESS KHI USER ĐÃ LOGIN
   * ================================
   */
  useEffect(() => {
    if (loading) return; // Đợi AuthContext hoàn tất

    // ❗ Nếu chưa login → không tự login → giống profile/edit
    if (!user) return;

    fetchAddress(user.username);
  }, [user, loading]);

  /**
   * ================================
   *  2) FETCH ADDRESS TỪ BACKEND
   * ================================
   */
  const fetchAddress = async (username: string) => {
  try {
    const res = await fetch(`/api/address?username=${username}`);
    const data = await res.json();

    if (data?.address) {
      const saved = data.address;

      // ❗ FIX: nếu API trả về rỗng → tự lấy VN hoặc country[0]
      const countryCode = saved.country || "VN";

      const countryData = countries.find(
        (c) => c.code === countryCode
      );

      setForm({
        name: saved.name || "",
        phone: saved.phone || "",
        address: saved.address || "",
        country: countryCode,
        countryCode: countryData?.dial || "+84", // ❗ không bao giờ dùng +00 nữa
      });
    } else {
      // Không có địa chỉ → set mặc định
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

  /**
   * ================================
   *  3) ĐỔI QUỐC GIA
   * ================================
   */
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

  /**
   * ================================
   *  4) LƯU ĐỊA CHỈ
   * ================================
   */
  const handleSave = async () => {
    if (!form.name || !form.phone || !form.address) {
      setMessage("⚠️ Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    if (!user) {
      setMessage("⚠️ Bạn chưa đăng nhập!");
      return;
    }

    setSaving(true);

    const payload = {
      username: user.username,
      ...form,
    };

    const res = await fetch("/api/address", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (data.success) {
      setMessage("✅ Đã lưu địa chỉ!");
      localStorage.setItem("shipping_info", JSON.stringify(form));

      // Chuyển sang checkout
      setTimeout(() => {
        router.push("/checkout");
      }, 500);
    } else {
      setMessage("❌ Lưu thất bại!");
    }

    setSaving(false);
  };

  /**
   * ================================
   *  5) UI KHI CHƯA CÓ USER
   * ================================
   */
  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">⏳ Đang tải...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-gray-600 mb-4">Bạn cần đăng nhập bằng Pi để tiếp tục</p>
        <button
          onClick={() => router.push("/login")}
          className="bg-orange-600 text-white px-5 py-2 rounded"
        >
          Đăng nhập với Pi
        </button>
      </main>
    );
  }

  /**
   * ================================
   *  6) UI CHÍNH
   * ================================
   */
  return (
    <main className="min-h-screen bg-gray-100 pb-20 relative">

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
            value={form.phone}
            placeholder="Nhập số điện thoại"
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
