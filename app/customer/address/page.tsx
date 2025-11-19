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

  // ===== 1. Load dữ liệu khi đã login =====
  useEffect(() => {
    if (loading) return;
    if (!user) return;

    const key = `addresses_${user.username}`;
    const local = typeof window !== "undefined" ? localStorage.getItem(key) : null;

    if (local) {
      // ưu tiên danh sách lưu local (nhiều địa chỉ)
      try {
        const parsed = JSON.parse(local) as Address[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAddresses(parsed);
          return;
        }
      } catch {
        /* ignore */
      }
    }

    // nếu local chưa có → lấy từ API (địa chỉ đơn cũ)
    fetchAddressFromApi(user.username);
  }, [user, loading]);

  const fetchAddressFromApi = async (username: string) => {
    try {
      const res = await fetch(`/api/address?username=${username}`);
      const data = await res.json();

      if (data?.address) {
        const saved = data.address;
        const countryCode = saved.country || "VN";
        const countryData = countries.find((c) => c.code === countryCode);

        const addr: Address = {
          name: saved.name || "",
          phone: saved.phone || "",
          address: saved.address || "",
          country: countryCode,
          countryCode: countryData?.dial || "+84",
          isDefault: true,
        };

        setAddresses([addr]);
      } else {
        setAddresses([]);
      }
    } catch (err) {
      console.error("❌ Lỗi tải địa chỉ:", err);
    }
  };

  // ===== 2. Lưu danh sách vào localStorage (theo user) =====
  const persistAddressesLocal = (next: Address[]) => {
    if (!user) return;
    const key = `addresses_${user.username}`;
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch (err) {
      console.error("❌ Lỗi lưu localStorage:", err);
    }
  };

  // ===== 3. Lưu địa chỉ (thêm / sửa) =====
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

    // cập nhật danh sách trên UI + local
    let updated = [...addresses];
    if (form.isDefault) {
      updated = updated.map((a) => ({ ...a, isDefault: false }));
    }

    if (editingIndex !== null) {
      updated[editingIndex] = { ...form };
    } else {
      updated.push({ ...form });
    }

    setAddresses(updated);
    persistAddressesLocal(updated);
    setFormVisible(false);

    try {
      // Gửi về API với format cũ (một địa chỉ duy nhất – địa chỉ mặc định)
      const defaultAddress =
        updated.find((a) => a.isDefault) || updated[updated.length - 1];

      const payload = {
        username: user.username,
        name: defaultAddress.name,
        phone: defaultAddress.phone,
        address: defaultAddress.address,
        country: defaultAddress.country,
        countryCode: defaultAddress.countryCode,
      };

      const res = await fetch("/api/address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setMessage("✅ Đã lưu địa chỉ!");
        localStorage.setItem("shipping_info", JSON.stringify(payload));
      } else {
        setMessage("❌ Lưu thất bại trên server, nhưng địa chỉ vẫn được lưu trên máy.");
      }
    } catch (err) {
      console.error("❌ Lỗi lưu API:", err);
      setMessage("❌ Lưu thất bại trên server, nhưng địa chỉ vẫn được lưu trên máy.");
    } finally {
      setSaving(false);
    }
  };

  // ===== 4. Đặt mặc định =====
  const setDefault = (index: number) => {
    const updated = addresses.map((item, i) => ({
      ...item,
      isDefault: i === index,
    }));
    setAddresses(updated);
    persistAddressesLocal(updated);
  };

  // ===== 5. Xoá địa chỉ =====
  const handleDelete = (index: number) => {
    const updated = addresses.filter((_, i) => i !== index);
    setAddresses(updated);
    persistAddressesLocal(updated);
  };

  // ===== 6. UI khi loading / chưa login =====
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
        <p className="text-gray-600 mb-4">
          Bạn cần đăng nhập bằng Pi để tiếp tục
        </p>
        <button
          onClick={() => router.push("/login")}
          className="bg-orange-600 text-white px-5 py-2 rounded"
        >
          Đăng nhập với Pi
        </button>
      </main>
    );
  }

  // ===== 7. UI chính =====
  return (
    <main className="min-h-screen bg-gray-100 pb-24 relative">
      {/* nút quay lại */}
      <button
        onClick={() => router.back()}
        className="absolute top-3 left-3 text-orange-600 text-lg font-bold"
      >
        ←
      </button>

      <div className="max-w-md mx-auto p-4 mt-14">
        <h1 className="text-xl font-bold mb-4 text-orange-600">
          📦 Địa chỉ giao hàng
        </h1>

        {/* Danh sách địa chỉ */}
        {addresses.length > 0 && (
          <>
            <h2 className="font-semibold mb-2">📦 Địa chỉ đã lưu:</h2>
            {addresses.map((item, index) => (
              <div
                key={index}
                className="bg-white p-4 rounded-lg shadow-sm mb-3 border"
              >
                <p className="font-semibold">
                  {item.name} — {item.phone}
                </p>
                <p className="text-sm text-gray-600 mt-1">{item.address}</p>
                <p className="text-xs text-gray-500 mt-1">
                  🌍{" "}
                  {countries.find((c) => c.code === item.country)?.name ||
                    item.country}{" "}
                  ({item.countryCode})
                </p>

                <div className="flex justify-between mt-3 text-sm">
                  <button
                    onClick={() => setDefault(index)}
                    className={`flex items-center gap-1 ${
                      item.isDefault
                        ? "text-orange-600 font-semibold"
                        : "text-gray-500"
                    }`}
                  >
                    <CheckCircle size={18} />
                    {item.isDefault ? "Mặc định" : "Chọn mặc định"}
                  </button>

                  <div className="flex gap-4">
                    <button
                      onClick={() => {
                        setForm(item);
                        setEditingIndex(index);
                        setFormVisible(true);
                        setMessage("");
                      }}
                      className="flex items-center gap-1 text-orange-500"
                    >
                      <Edit size={18} />
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(index)}
                      className="flex items-center gap-1 text-red-500"
                    >
                      <Trash2 size={18} />
                      Xoá
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

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
                isDefault: addresses.length === 0, // địa chỉ đầu tiên mặc định
              });
              setMessage("");
            }}
          >
            <PlusCircle size={20} />
            Thêm địa chỉ mới
          </button>
        )}

        {/* Form nhập địa chỉ */}
        {formVisible && (
          <div className="bg-white p-4 rounded-lg shadow mt-4">
            <label className="text-sm font-medium mb-1 block">🌍 Quốc gia</label>
            <select
              className="border p-2 w-full rounded mb-3"
              value={form.country}
              onChange={(e) => {
                const code = e.target.value;
                const selected = countries.find((c) => c.code === code);
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
              placeholder="Tên người nhận"
              className="border p-2 w-full rounded mb-3"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />

            <div className="flex mb-3">
              <span className="px-3 py-2 bg-gray-100 border rounded-l">
                {form.countryCode}
              </span>
              <input
                placeholder="Số điện thoại"
                className="border p-2 w-full rounded-r"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>

            <textarea
              placeholder="Địa chỉ chi tiết (Tỉnh/Thành phố, Quận/Huyện...)"
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
              disabled={saving}
              className={`w-full py-3 rounded-lg text-white font-semibold ${
                saving ? "bg-gray-400" : "bg-orange-600 hover:bg-orange-700"
              }`}
            >
              {saving ? "Đang lưu..." : "Lưu địa chỉ"}
            </button>

            {message && (
              <p className="mt-3 text-center text-sm text-gray-700">
                {message}
              </p>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
