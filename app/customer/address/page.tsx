"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { countries } from "@/data/countries";
import { useAuth } from "@/context/AuthContext";
import { Edit, Trash2, CheckCircle, PlusCircle } from "lucide-react";

export default function CustomerAddressPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [addresses, setAddresses] = useState<any[]>([]);
  const [formVisible, setFormVisible] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    country: "VN",
    countryCode: "+84",
    isDefault: false,
  });

  useEffect(() => {
    if (loading || !user) return;
    fetch(`/api/address?username=${user.username}`)
      .then((res) => res.json())
      .then((data) => setAddresses(data?.addresses || []));
  }, [user, loading]);

  const handleSave = async () => {
    if (!form.name || !form.phone || !form.address) return;

    let updated = [...addresses];
    if (form.isDefault) updated = updated.map((a) => ({ ...a, isDefault: false }));

    if (editingIndex !== null) updated[editingIndex] = { ...form };
    else updated.push({ ...form });

    setAddresses(updated);
    setFormVisible(false);

    fetch("/api/address", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: user?.username, addresses: updated }),
    });
  };

  const setDefault = (index: number) => {
    const updated = addresses.map((item, i) => ({
      ...item,
      isDefault: i === index,
    }));
    setAddresses(updated);
  };

  return (
    <main className="min-h-screen bg-gray-100 pb-24">

      <button onClick={() => router.back()} className="absolute top-3 left-3 text-orange-600 text-lg">
        ←
      </button>

      <div className="max-w-md mx-auto p-4 mt-14">
        <h1 className="text-xl font-bold mb-4 text-orange-600">
          📦 Địa chỉ giao hàng
        </h1>

        {/* Danh sách địa chỉ */}
        {addresses.map((item, index) => (
          <div
            key={index}
            className="bg-white p-4 rounded-lg shadow-sm mb-3 border"
          >
            <p className="font-semibold">{item.name} — {item.phone}</p>
            <p className="text-sm text-gray-600 mt-1">{item.address}</p>
            <p className="text-xs text-gray-500 mt-1">
              🌍 {countries.find((c) => c.code === item.country)?.name}
            </p>

            <div className="flex justify-between mt-3 text-sm">
              <button
                onClick={() => setDefault(index)}
                className={`flex items-center gap-1 ${
                  item.isDefault ? "text-orange-600 font-semibold" : "text-gray-500"
                }`}
              >
                <CheckCircle size={18} />
                Đặt làm mặc định
              </button>

              <div className="flex gap-4">
                <Edit
                  size={20}
                  className="text-orange-500 cursor-pointer"
                  onClick={() => {
                    setForm(item);
                    setEditingIndex(index);
                    setFormVisible(true);
                  }}
                />
                <Trash2
                  size={20}
                  className="text-red-500 cursor-pointer"
                  onClick={() =>
                    setAddresses(addresses.filter((_, i) => i !== index))
                  }
                />
              </div>
            </div>
          </div>
        ))}

        {/* Nút mở form */}
        {!formVisible && (
          <button
            className="w-full py-3 rounded-lg bg-orange-500 text-white font-semibold flex items-center justify-center gap-2 mt-4"
            onClick={() => {
              setFormVisible(true);
              setEditingIndex(null);
              setForm({
                name: "",
                phone: "",
                address: "",
                country: "VN",
                countryCode: "+84",
                isDefault: false,
              });
            }}
          >
            <PlusCircle size={20} /> Thêm địa chỉ mới
          </button>
        )}

        {/* Form nhập địa chỉ */}
        {formVisible && (
          <div className="bg-white p-4 rounded-lg shadow mt-4">
            <input
              placeholder="Tên"
              className="border p-2 w-full rounded mb-3"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />

            <input
              placeholder="Số điện thoại"
              className="border p-2 w-full rounded mb-3"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />

            <textarea
              placeholder="Địa chỉ (Tỉnh, Thành phố, Quận...)"
              className="border p-2 w-full rounded mb-3"
              rows={3}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />

            <label className="flex items-center gap-2 mb-3 text-sm">
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(e) =>
                  setForm({ ...form, isDefault: e.target.checked })
                }
              />
              Đặt làm địa chỉ mặc định
            </label>

            <button
              onClick={handleSave}
              className="w-full py-3 bg-orange-600 text-white rounded-lg font-semibold"
            >
              Lưu ngay bây giờ
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
