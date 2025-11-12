"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function EditProfilePage() {
  const router = useRouter();
  const [info, setInfo] = useState({
    pi_uid: "",
    displayName: "",
    email: "",
    phoneCode: "+84", // 🇻🇳 mặc định Việt Nam
    phone: "",
    address: "",
    province: "",
    country: "",
  });
  const [saving, setSaving] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // ✅ Lấy thông tin từ Pi login
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

        // ✅ Gọi API lấy hồ sơ hiện có
        if (user.uid || user.id) {
          fetch(`/api/profile?pi_uid=${user.uid || user.id}`)
            .then((res) => res.json())
            .then((data) => {
              if (data) setInfo((prev) => ({ ...prev, ...data }));
            })
            .catch(() => console.log("⚠️ Không thể tải dữ liệu hồ sơ"));
        }
      } else {
        alert("⚠️ Vui lòng đăng nhập bằng Pi Network trước khi chỉnh sửa hồ sơ!");
        router.replace("/pilogin");
      }
    } catch (err) {
      console.error("❌ Lỗi đọc thông tin đăng nhập:", err);
    }
  }, [router]);

  // ✅ Lưu hồ sơ
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
        console.error(data.error);
      }
    } catch (err) {
      console.error("❌ Lỗi khi lưu hồ sơ:", err);
      alert("❌ Có lỗi xảy ra khi lưu hồ sơ.");
    } finally {
      setSaving(false);
    }
  };

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

            {/* 🧍 Tên người dùng */}
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Tên người dùng
              </label>
              <input
                type="text"
                value={info.displayName}
                onChange={(e) =>
                  setInfo({ ...info, displayName: e.target.value })
                }
                className="w-full border px-3 py-2 rounded"
                placeholder="Nhập tên người dùng"
              />
            </div>

            {/* ✉️ Email */}
            <div>
              <label className="block text-sm text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={info.email}
                onChange={(e) => setInfo({ ...info, email: e.target.value })}
                className="w-full border px-3 py-2 rounded"
                placeholder="you@example.com"
              />
            </div>

            {/* 📞 Số điện thoại + mã vùng */}
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Số điện thoại
              </label>
              <div className="flex space-x-2">
                <select
                  value={info.phoneCode}
                  onChange={(e) =>
                    setInfo({ ...info, phoneCode: e.target.value })
                  }
                  className="border rounded px-2 py-2 w-24"
                >
                  <option value="+84">🇻🇳 +84</option>
                  <option value="+1">🇺🇸 +1</option>
                  <option value="+81">🇯🇵 +81</option>
                  <option value="+82">🇰🇷 +82</option>
                  <option value="+33">🇫🇷 +33</option>
                </select>
                <input
                  type="tel"
                  value={info.phone}
                  onChange={(e) => setInfo({ ...info, phone: e.target.value })}
                  className="flex-1 border px-3 py-2 rounded"
                  placeholder="0987xxxxxx"
                />
              </div>
            </div>

            {/* 🏡 Địa chỉ chi tiết */}
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Địa chỉ chi tiết
              </label>
              <textarea
                value={info.address}
                onChange={(e) => setInfo({ ...info, address: e.target.value })}
                className="w-full border px-3 py-2 rounded h-20"
                placeholder="VD: Số 12, ngõ 34, đường Giải Phóng..."
              />
            </div>

            {/* 🏙️ Tỉnh / Thành phố */}
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Tỉnh / Thành phố
              </label>
              <input
                type="text"
                value={info.province}
                onChange={(e) => setInfo({ ...info, province: e.target.value })}
                className="w-full border px-3 py-2 rounded"
                placeholder="VD: Hà Nội"
              />
            </div>

            {/* 🌍 Quốc gia */}
            <div>
              <label className="block text-sm text-gray-700 mb-1">Quốc gia</label>
              <select
                value={info.country}
                onChange={(e) => setInfo({ ...info, country: e.target.value })}
                className="w-full border px-3 py-2 rounded"
              >
                <option value="">-- Chọn quốc gia --</option>
                <option value="Việt Nam">🇻🇳 Việt Nam</option>
                <option value="Hoa Kỳ">🇺🇸 Hoa Kỳ</option>
                <option value="Nhật Bản">🇯🇵 Nhật Bản</option>
                <option value="Hàn Quốc">🇰🇷 Hàn Quốc</option>
                <option value="Pháp">🇫🇷 Pháp</option>
              </select>
            </div>
          </div>

          {/* Nút lưu và quay lại */}
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
