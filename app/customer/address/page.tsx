"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { countries } from "@/data/countries";
import { useAuth } from "@/context/AuthContext";
import { Edit, Trash2, CheckCircle, PlusCircle } from "lucide-react";

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

  const [form, setForm] = useState<Address>({
    name: "",
    phone: "",
    address: "",
    country: "VN",
    countryCode: "+84",
    isDefault: false,
  });

  useEffect(() => {
    if (!user || loading) return;

    const local = localStorage.getItem(`addresses_${user.username}`);
    if (local) {
      setAddresses(JSON.parse(local));
    } else {
      fetchFromAPI(user.username);
    }
  }, [user, loading]);

  const fetchFromAPI = async (username: string) => {
    try {
      const res = await fetch(`/api/address?username=${username}`);
      const data = await res.json();
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
      console.error(err);
    }
  };

  const saveToLocal = (list: Address[]) => {
    if (!user) return;
    localStorage.setItem(`addresses_${user.username}`, JSON.stringify(list));
  };

  const handleSave = async () => {
    if (!form.name || !form.phone || !form.address) {
      setMessage("⚠️ Nhập đầy đủ thông tin!");
      return;
    }

    let updated = [...addresses];
    if (form.isDefault) updated = updated.map((a) => ({ ...a, isDefault: false }));

    if (editingIndex !== null) updated[editingIndex] = { ...form };
    else updated.push({ ...form });

    setAddresses(updated);
    saveToLocal(updated);
    setFormVisible(false);

    // Gửi địa chỉ mặc định lên API như cũ
    const defaultAddr = updated.find((a) => a.isDefault) || updated[0];

    setSaving(true);
    const res = await fetch("/api/address", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: user?.username, ...defaultAddr }),
    });
    const data = await res.json();
    setSaving(false);
    setMessage(data?.success ? "✅ Đã lưu!" : "❌ Lỗi khi lưu!");
  };

  const handleDelete = (index: number) => {
    const updated = addresses.filter((_, i) => i !== index);
    setAddresses(updated);
    saveToLocal(updated);
  };

  const setDefault = (index: number) => {
    const updated = addresses.map((a, i) => ({
      ...a,
      isDefault: i === index,
    }));
    setAddresses(updated);
    saveToLocal(updated);
  };

  if (loading)
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p>⏳ Loading...</p>
      </main>
    );

  if (!user)
    return (
      <main className="min-h-screen flex flex-col items-center justify-center">
        <p>🔐 Bạn cần đăng nhập để tiếp tục</p>
        <button
          onClick={() => router.push("/login")}
          className="bg-orange-600 text-white px-5 py-2 rounded"
        >
          Đăng nhập
        </button>
      </main>
    );

  return (
    <main className="min-h-screen bg-gray-100 pb-20 relative">
      <button onClick={() => router.back()} className="absolute top-3 left-3 text-orange-600">
        ←
      </button>

      <div className="max-w-md mx-auto p-6 mt-14">
        <h1 className="text-xl font-bold text-orange-600 mb-4">
          📍 Địa chỉ giao hàng
        </h1>

        {/* Danh sách nhiều địa chỉ */}
        {addresses.map((item, index) => (
          <div key={index} className="bg-white p-4 rounded shadow mb-3 border">
            <p className="font-semibold">{item.name} — {item.phone}</p>
            <p className="text-sm">{item.address}</p>
            <p className="text-xs text-gray-500">
              🌍 {countries.find((c) => c.code === item.country)?.name} ({item.countryCode})
            </p>

            <div className="flex justify-between mt-3 text-sm">
              <button
                onClick={() => setDefault(index)}
                className={item.isDefault ? "text-orange-600 font-bold" : "text-gray-500"}
              >
                ✓ Mặc định
              </button>

              <div className="flex gap-3">
                <button
                  className="text-blue-500"
                  onClick={() => {
                    setForm(item);
                    setEditingIndex(index);
                    setFormVisible(true);
                  }}
                >
                  ✏️ Sửa
                </button>
                <button
                  className="text-red-500"
                  onClick={() => handleDelete(index)}
                >
                  🗑 Xoá
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
              setEditingIndex(null);
              setForm({
                name: "",
                phone: "",
                address: "",
                country: "VN",
                countryCode: "+84",
                isDefault: addresses.length === 0,
              });
            }}
            className="w-full py-3 bg-orange-600 text-white rounded flex justify-center gap-2"
          >
            <PlusCircle /> Thêm địa chỉ mới
          </button>
        )}

        {/* Form nhập địa chỉ */}
        {formVisible && (
          <div className="bg-white p-4 rounded shadow mt-4">
            <select
              className="border p-2 w-full rounded mb-3"
              value={form.country}
              onChange={(e) => {
                const code = e.target.value;
                const c = countries.find((x) => x.code === code);
                setForm({
                  ...form,
                  country: code,
                  countryCode: c?.dial || "+84",
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
              {saving ? "Đang lưu..." : "💾 Lưu"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
