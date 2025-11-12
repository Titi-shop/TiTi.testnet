"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function EditProfilePage() {
  const router = useRouter();
  const [info, setInfo] = useState({
    pi_uid: "",
    displayName: "",
    email: "",
    phone: "",
    country: "",
    province: "",
    district: "",
    address: "",
  });
  const [saving, setSaving] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // ✅ Lấy thông tin người dùng từ Pi login
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

        // ✅ Gọi API lấy hồ sơ nếu đã có UID
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

  // ✅ Xử lý lưu hồ sơ
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
            {/* Thông tin cơ bản */}
            {[
              ["displayName", "Tên người dùng"],
              ["email", "Email"],
              ["phone", "Số điện thoại"],
            ].map(([field, label]) => (
              <div key={field}>
                <label className="block text-sm text-gray-700">{label}</label>
                <input
                  type="text"
                  value={info[field as keyof typeof info] || ""}
                  onChange={(e) =>
                    setInfo({ ...info, [field]: e.target.value })
                  }
                  className="w-full border px-3 py-2 rounded"
                />
              </div>
            ))}

            {/* 🆕 Nhóm địa chỉ chi tiết */}
            <div className="border-t pt-4 mt-4">
              <h2 className="font-semibold text-gray-800 mb-2">
                📍 Thông tin địa chỉ
              </h2>

              {/* Quốc gia */}
              <div>
                <label className="block text-sm text-gray-700">Quốc gia</label>
                <select
                  className="w-full border px-3 py-2 rounded"
                  value={info.country}
                  onChange={(e) =>
                    setInfo({ ...info, country: e.target.value })
                  }
                >
                  <option value="">-- Chọn quốc gia --</option>
                  <option value="Việt Nam">🇻🇳 Việt Nam</option>
                  <option value="Hoa Kỳ">🇺🇸 Hoa Kỳ</option>
                  <option value="Nhật Bản">🇯🇵 Nhật Bản</option>
                  <option value="Hàn Quốc">🇰🇷 Hàn Quốc</option>
                  <option value="Pháp">🇫🇷 Pháp</option>
                </select>
              </div>

              {/* Tỉnh / Thành */}
              <div>
                <label className="block text-sm text-gray-700">
                  Tỉnh / Thành phố
                </label>
                <input
                  type="text"
                  value={info.province}
                  onChange={(e) =>
                    setInfo({ ...info, province: e.target.value })
                  }
                  className="w-full border px-3 py-2 rounded"
                  placeholder="VD: Hà Nội"
                />
              </div>

              {/* Quận / Huyện */}
              <div>
                <label className="block text-sm text-gray-700">
                  Quận / Huyện
                </label>
                <input
                  type="text"
                  value={info.district}
                  onChange={(e) =>
                    setInfo({ ...info, district: e.target.value })
                  }
                  className="w-full border px-3 py-2 rounded"
                  placeholder="VD: Hoàng Mai"
                />
              </div>

              {/* Địa chỉ cụ thể */}
              <div>
                <label className="block text-sm text-gray-700">
                  Địa chỉ chi tiết
                </label>
                <textarea
                  value={info.address}
                  onChange={(e) =>
                    setInfo({ ...info, address: e.target.value })
                  }
                  className="w-full border px-3 py-2 rounded h-20"
                  placeholder="VD: Số 12, ngõ 34, đường Giải Phóng..."
                />
              </div>
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
