"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useLanguage } from "../../context/LanguageContext";

export default function EditProductPage() {
  const { id } = useParams();
  const router = useRouter();
  const { translate } = useLanguage();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // 🧩 Tải thông tin sản phẩm theo ID
  useEffect(() => {
    if (!id) return;

    fetch("/api/products")
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

  // 🧩 Hàm lưu sản phẩm
  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const formData = new FormData(e.target as HTMLFormElement);
      formData.append("id", String(product.id));

      const res = await fetch("/api/products", {
        method: "PUT",
        body: formData,
      });

      const result = await res.json();

      if (result.success) {
        alert("✅ Cập nhật sản phẩm thành công!");
        router.push("/seller/stock");
      } else {
        setError(result.message || "Lỗi khi cập nhật sản phẩm");
      }
    } catch (err) {
      console.error("❌ PUT error:", err);
      setError("Không thể cập nhật sản phẩm.");
    } finally {
      setSaving(false);
    }
  }

  if (loading)
    return <p className="text-center mt-10 text-gray-600">Đang tải dữ liệu...</p>;

  if (!product)
    return <p className="text-center mt-10 text-red-500">Không tìm thấy sản phẩm!</p>;

  return (
    <main className="max-w-lg mx-auto p-6 bg-white rounded-xl shadow mt-10">
      <h1 className="text-xl font-bold mb-4 text-center text-gray-800">
        ✏️ {translate("edit_product") || "Chỉnh sửa sản phẩm"}
      </h1>

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block font-medium text-gray-700 mb-1">Tên sản phẩm</label>
          <input
            name="name"
            defaultValue={product.name}
            required
            className="w-full border rounded-md p-2"
          />
        </div>

        <div>
          <label className="block font-medium text-gray-700 mb-1">Giá (Pi)</label>
          <input
            name="price"
            type="number"
            defaultValue={product.price}
            required
            className="w-full border rounded-md p-2"
          />
        </div>

        <div>
          <label className="block font-medium text-gray-700 mb-1">Mô tả</label>
          <textarea
            name="description"
            defaultValue={product.description}
            rows={3}
            className="w-full border rounded-md p-2"
          ></textarea>
        </div>

        <div>
          <label className="block font-medium text-gray-700 mb-1">Ảnh (URL, cách nhau bởi dấu phẩy)</label>
          <input
            name="images"
            defaultValue={product.images?.join(", ")}
            className="w-full border rounded-md p-2"
          />
        </div>

        {error && <p className="text-red-500 text-center">{error}</p>}

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
