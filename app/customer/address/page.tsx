"use client";

import { useEffect, useState, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { countries } from "@/data/countries";
import { useAuth } from "@/context/AuthContext";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";

interface AddressForm {
  name: string;
  phone: string;
  address: string;
  country: string;
  countryCode: string;
}

export default function CustomerAddressPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { t } = useTranslation(); // ⭐ Sử dụng i18n

  const [form, setForm] = useState<AddressForm>({
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
    if (loading) return;
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
        const countryCode = saved.country || "VN";
        const countryData = countries.find((c) => c.code === countryCode);

        setForm({
          name: saved.name || "",
          phone: saved.phone || "",
          address: saved.address || "",
          country: countryCode,
          countryCode: countryData?.dial || "+84",
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

  /**
   * ================================
   *  3) ĐỔI QUỐC GIA
   * ================================
   */
  const handleCountryChange = (e: ChangeEvent<HTMLSelectElement>) => {
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
      setMessage("⚠️ " + t.fill_all_fields);
      return;
    }

    if (!user) {
      setMessage("⚠️ " + t.must_login_first);
      return;
    }

    setSaving(true);

    const payload = { username: user.username, ...form };

    const res = await fetch("/api/address", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (data.success) {
      setMessage("✅ " + t.address_saved);
      localStorage.setItem("shipping_info", JSON.stringify(form));

      setTimeout(() => {
        router.push("/checkout");
      }, 500);
    } else {
      setMessage("❌ " + t.save_failed);
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
        <p className="text-gray-500">⏳ {t.loading}</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-gray-600 mb-4">{t.login_required}</p>
        <button
          onClick={() => router.push("/login")}
          className="bg-orange-600 text-white px-5 py-2 rounded"
        >
          {t.login_with_pi}
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
        className="absolute top-3 left-3 text-orange-600 text-lg font-bold"
      >
        ←
      </button>

      <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow mt-14">
        <h1 className="text-2xl font-bold text-center text-orange-600 mb-4">
          📍 {t.shipping_address}
        </h1>

        {/* Quốc gia */}
        <label className="block mb-2 font-medium">🌍 {t.country}</label>
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
        <label className="block mb-2 font-medium">👤 {t.full_name}</label>
        <input
          className="border p-2 w-full rounded mb-3"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        {/* Số điện thoại */}
        <label className="block mb-2 font-medium">📞 {t.phone_number}</label>
        <div className="flex mb-3">
          <span className="px-3 py-2 bg-gray-100 border rounded-l">
            {form.countryCode}
          </span>
          <input
            type="tel"
            className="border p-2 w-full rounded-r"
            value={form.phone}
            placeholder={t.enter_phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </div>

        {/* Địa chỉ */}
        <label className="block mb-2 font-medium">🏠 {t.address}</label>
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
          {saving ? t.saving : "💾 " + t.save_address}
        </button>

        {message && (
          <p className="mt-3 text-center text-sm text-gray-700">{message}</p>
        )}
      </div>
    </main>
  );
}
