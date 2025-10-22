"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useLanguage } from "../../../context/LanguageContext";

export default function EditProductPage() {
  const { id } = useParams();
  const router = useRouter();
  const { translate } = useLanguage();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [sellerUser, setSellerUser] = useState<string>("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);

  // ✅ Lấy thông tin đăng nhập Pi
  useEffect(() => {
    try {
      const stored = localStorage.getItem("pi_user");
      const logged = localStorage.getItem("titi_is_logged_in");
      if (stored && logged === "true") {
        const parsed = JSON.parse(stored);
        const username = parsed?.user?.username || parsed?.username || "guest_user";
        setSellerUser(username);
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
      }
    } catch (err) {
      console.error("❌ Lỗi đọc Pi user:", err);
      setIsLoggedIn(false);
    }
  }, []);

  // 🧩 Tải thông tin sản phẩm theo ID
  useEffect(() => {
    if (!id) return;

    fetch("/api/products", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        const found = data.find((p: any) => String(p.id) === String(id));
        setProduct(found || null);
        setLoading(false);
      })
      .catch((err) => {
        console.error("❌ Lỗi tải sản phẩm:", err);
        setError("Không thể tải thông tin sản phẩm.");
        setLoading(false);
      });
  }, [id]);

  // 🧩 Nếu chưa đăng nhập
  if (!isLoggedIn && !loading)
    return (
      <main className="text-center p-6">
        <h2 className="text-xl text-red-600 mb-3">
          🔐 {translate("login_required") || "Vui lòng đăng nhập bằng Pi Network để chỉnh sửa sản phẩm"}
        </h2>
        <button
          onClick={() => router.push("/pilogin")}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          👉 {translate("go_to_login") || "Đăng nhập ngay"}
        </button>
      </main>
    );

  // 🧩 Nếu đang tải
  if (loading)
    return <p className="text-center mt-10 text-gray-600">Đang tải dữ liệu...</p>;

  // 🧩 Nếu không tìm thấy
  if (!product)
    return <p className="text-center mt-10 text-red-500">Không tìm thấy sản phẩm!</p>;

  // ✅ Kiểm tra quyền sửa sản phẩm
  if (product.seller && product.seller.toLowerCase() !== sellerUser.toLowerCase())
    return (
      <main className="text-center p-6">
        <h2 className="text-xl text-red-600 mb-3">
          🚫 {translate("unauthorized_edit") || "Bạn không có quyền sửa sản phẩm này."}
        </h2>
        <button
          onClick={() => router.push("/seller/stock")}
          className="bg-gray-300 hover:bg-gray-400 text-black px-4 py-2 rounded"
        >
          ↩️ {translate("back_seller_area") || "Quay lại khu vực Người Bán"}
        </button>
      </main>
    );

  // 🧩 Hàm lưu sản phẩm
  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const form = e.currentTarget;
      const formData = new FormData(form);

      formData.append("id", String(product.id));
      formData.append("seller", sellerUser); // ✅ Gắn người bán hiện tại

      const rawImages = (formData.get("images") as string)
        ?.split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      formData.delete("images");
      rawImages.forEach((img) => formData.append("images", img));

      const res = await fetch("/api/products", {
        method: "PUT",
        body: formData,
      });

      const result = await res.json();

      if (result.success) {
        alert("✅ Cập nhật sản phẩm thành công!");
        router.push("/seller/stock");
      } else {
        setError(result.message || "Không thể cập nhật sản phẩm.");
      }
    } catch (err) {
      console.error("❌ PUT error:", err);
      setError("Không thể cập nhật sản phẩm.");
    } finally {
      setSaving(false);
    }
  }

  // ============================== UI ==============================
  return (
    <main className="max-w-lg mx-auto p-6 bg-white rounded-xl shadow mt-10">
      <h1 className="text-xl font-bold mb-4 text-center text-gray-800">
        ✏️ {translate("edit_product") || "Chỉnh sửa sản phẩm"}
      </h1>

      <p className="text-center text-gray-500 mb-2">
        👤 {translate("seller_label") || "Người bán"}: <b>{sellerUser}</b>
      </p>

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block font-medium text-gray-700 mb-1">
            {translate("product_name") || "Tên sản phẩm"}
          </label>
          <input
            name="name"
            defaultValue={product.name}
            required
            className="w-full border rounded-md p-2"
          />
        </div>

        <div>
          <label className="block font-medium text-gray-700 mb-1">
            {translate("product_price") || "Giá (Pi)"}
          </label>
          <input
            name="price"
            type="number"
            defaultValue={product.price}
            required
            className="w-full border rounded-md p-2"
          />
        </div>

        <div>
          <label className="block font-medium text-gray-700 mb-1">
            {translate("product_description") || "Mô tả"}
          </label>
          <textarea
            name="description"
            defaultValue={product.description}
            rows={3}
            className="w-full border rounded-md p-2"
          ></textarea>
        </div>

        <div>
          <label className="block font-medium text-gray-700 mb-1">
            {translate("image_urls") || "Ảnh (URL, cách nhau bởi dấu phẩy)"}
          </label>
          <input
            name="images"
            defaultValue={product.images?.join(", ")}
            className="w-full border rounded-md p-2"
          />
        </div>

        {error && (
          <p className="text-red-500 text-center font-medium">{error}</p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-green-600 hover:bg-green-700 text-white p-3 rounded-lg font-semibold transition"
        >
          {saving ? "💾 Đang lưu..." : "✅ Lưu thay đổi"}
        </button>
      </form>
    </main>
  );
}
