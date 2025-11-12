"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { countries } from "@/data/countries";
import { provincesByCountry } from "@/data/provinces";

export default function EditProfilePage() {
  const router = useRouter();
  const [info, setInfo] = useState({
    pi_uid: "",
    displayName: "",
    email: "",
    phoneCode: "+84",
    phone: "",
    address: "",
    province: "",
    country: "VN",
  });
  const [saving, setSaving] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // ✅ Lấy thông tin đăng nhập Pi
  useEffect(() => {
    try {
      const stored = localStorage.getItem("pi_user");
      const logged = localStorage.getItem("titi_is_logged_in");

      if (stored && logged === "true") {
        const parsed = JSON.parse(stored);
        const user = parsed.user || {};
        setInfo((prev) => ({
          ...prev,
          pi_uid: user.uid || user.id || "",
          displayName: user.username || "",
        }));
        setIsLoggedIn(true);

        // ✅ Gọi API lấy hồ sơ
        if (user.uid || user.id) {
          fetch(`/api/profile?pi_uid=${user.uid || user.id}`)
            .then((res) => res.json())
            .then((data) => {
              if (data) setInfo((prev) => ({ ...prev, ...data }));
            })
            .catch(() => console.log("⚠️ Không thể tải hồ sơ"));
        }
      } else {
        alert("⚠️ Vui lòng đăng nhập bằng Pi Network trước!");
        router.replace("/pilogin");
      }
    } catch (err) {
      console.error("❌ Lỗi đọc thông tin đăng nhập:", err);
    }
  }, [router]);

  // ✅ Lưu thông tin hồ sơ
  const handleSave = async () => {
    if (!isLoggedIn || !info.pi_uid) {
      alert("❌ Không thể lưu — chưa đăng nhập Pi Network.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(info),
      });

      const data = await res.json();
      if (data.success) {
        alert("✅ Đã lưu hồ sơ thành công!");
        router.push("/customer/profile");
      } else {
        alert("❌ Lưu thất bại!");
      }
    } catch (err) {
      console.error("❌ Lỗi khi lưu hồ sơ:", err);
    } finally {
      setSaving(false);
    }
  };

  // 🆕 Danh sách tỉnh/thành dựa trên quốc gia được chọn
  const provinceList = provincesByCountry[info.country] || [];

  return (
    <main className="p-4 max-w-md mx-auto">
      <h1 className="text-xl font-bold text-orange-600 mb-4">
        👤 Cập nhật hồ sơ
      </h1>

      {!isLoggedIn ? (
        <p className="text-center text-gray-500">
          🔐 Bạn cần đăng nhập bằng Pi Network để chỉnh sửa hồ sơ.
        </p>
      ) : (
        <>
          <div className="space-y-4">

            {/* Tên */}
            <div>
              <label className="block text-sm text-gray-700 mb-1">Tên người dùng</label>
              <input
                type="text"
                value={info.displayName}
                onChange={(e) => setInfo({ ...info, displayName: e.target.value })}
                className="w-full border px-3 py-2 rounded"
              />
            </div>

            {/* Gmail */}
            <div>
              <label className="block text-sm text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={info.email}
                onChange={(e) => setInfo({ ...info, email: e.target.value })}
                className="w-full border px-3 py-2 rounded"
              />
            </div>

            {/* Điện thoại + mã vùng */}
            <div>
              <label className="block text-sm text-gray-700 mb-1">Số điện thoại</label>
              <div className="flex space-x-2">
                <select
                  className="border px-2 py-2 rounded w-24"
                  value={info.phoneCode}
                  onChange={(e) => setInfo({ ...info, phoneCode: e.target.value })}
                >
                  <option value="+84">🇻🇳 +84</option>
                  <option value="+1">🇺🇸 +1</option>
                  <option value="+81">🇯🇵 +81</option>
                  <option value="+82">🇰🇷 +82</option>
                  <option value="+33">🇫🇷 +33</option>
                </select>
                <input
                  type="tel"
                  className="flex-1 border px-3 py-2 rounded"
                  value={info.phone}
                  onChange={(e) => setInfo({ ...info, phone: e.target.value })}
                  placeholder="Nhập số điện thoại"
                />
              </div>
            </div>

            {/* Địa chỉ */}
            <div>
              <label className="block text-sm text-gray-700 mb-1">Địa chỉ</label>
              <textarea
                className="w-full border px-3 py-2 rounded h-20"
                value={info.address}
                onChange={(e) => setInfo({ ...info, address: e.target.value })}
                placeholder="Số nhà, đường, phường..."
              />
            </div>

            {/* Quốc gia */}
            <div>
              <label className="block text-sm text-gray-700 mb-1">Quốc gia</label>
              <select
                className="w-full border px-3 py-2 rounded"
                value={info.country}
                onChange={(e) =>
                  setInfo({ ...info, country: e.target.value, province: "" })
                }
              >
                {countries.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Tỉnh / Thành phố */}
            <div>
              <label className="block text-sm text-gray-700 mb-1">Tỉnh / Thành phố</label>
              <select
                className="w-full border px-3 py-2 rounded"
                value={info.province}
                onChange={(e) => setInfo({ ...info, province: e.target.value })}
              >
                <option value="">-- Chọn --</option>
                {provinceList.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Nút */}
          <div className="flex justify-between mt-6">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded"
            >
              {saving ? "Đang lưu..." : "💾 Lưu"}
            </button>

            <button
              onClick={() => router.push("/customer/profile")}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-5 py-2 rounded"
            >
              ← Quay lại
            </button>
          </div>
        </>
      )}
    </main>
  );
}
