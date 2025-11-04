"use client";

import { useEffect, useState, useRef } from "react";
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

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ✅ Lấy thông tin đăng nhập Pi
  useEffect(() => {
    try {
      const stored = localStorage.getItem("pi_user");
      const logged = localStorage.getItem("titi_is_logged_in");
      if (stored && logged === "true") {
        const parsed = JSON.parse(stored);
        const username = (parsed?.user?.username || parsed?.username || "")
          .trim()
          .toLowerCase();
        setSellerUser(username);
      } else {
        router.push("/pilogin");
      }
    } catch (err) {
      console.error("❌ Lỗi đọc Pi user:", err);
      router.push("/pilogin");
    }
  }, [router]);

  // 🧩 Tải thông tin sản phẩm
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

  // ✅ Hàm upload ảnh
  async function handleFileUpload(file: File): Promise<string | null> {
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) return data.url;
      throw new Error(data.message);
    } catch (err) {
      console.error("❌ Upload lỗi:", err);
      setError("Không thể tải ảnh lên.");
      return null;
    }
  }

  // ✅ Hàm lưu sản phẩm
  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const form = e.currentTarget;
    const name = (form.name as any).value;
    const price = parseFloat((form.price as any).value);
    const description = (form.description as any).value;

    let imageUrls = product.images || [];

    // Nếu người dùng chọn ảnh mới → upload lên Blob
    if (fileInputRef.current?.files?.length) {
      const file = fileInputRef.current.files[0];
      const url = await handleFileUpload(file);
      if (url) imageUrls = [url];
    }

    try {
      const res = await fetch("/api/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: product.id,
          name,
          price,
          description,
          images: imageUrls,
          seller: sellerUser,
        }),
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

  // 🧩 Nếu đang tải
  if (loading)
    return <p className="text-center mt-10 text-gray-600">Đang tải dữ liệu...</p>;

  if (!product)
    return <p className="text-center mt-10 text-red-500">Không tìm thấy sản phẩm!</p>;

  return (
    <main
      className="max-w-lg mx-auto p-6 bg-white rounded-xl shadow mt-10 pb-32"
      style={{ scrollMarginBottom: "80px" }}
    >
      <h1 className="text-xl font-bold mb-4 text-center text-gray-800">
        ✏️ {translate("edit_product") || "Chỉnh sửa sản phẩm"}
      </h1>

      <p className="text-center text-gray-500 mb-3">
        👤 Người bán: <b>{sellerUser}</b>
      </p>

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block font-medium mb-1">Tên sản phẩm</label>
          <input
            name="name"
            defaultValue={product.name}
            required
            className="w-full border rounded-md p-2"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Giá (Pi)</label>
          <input
            name="price"
            type="number"
            defaultValue={product.price}
            required
            className="w-full border rounded-md p-2"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Mô tả sản phẩm</label>
          <textarea
            name="description"
            defaultValue={product.description}
            rows={3}
            className="w-full border rounded-md p-2"
          ></textarea>
        </div>

        <div>
          <label className="block font-medium mb-1">Ảnh sản phẩm</label>
          <input ref={fileInputRef} type="file" accept="image/*" className="w-full" />
          {product.images?.[0] && (
            <img
              src={product.images[0]}
              alt="preview"
              className="w-full h-48 object-cover mt-2 rounded-md"
            />
          )}
        </div>

        {error && <p className="text-red-500 text-center font-medium">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-green-600 hover:bg-green-700 text-white p-3 rounded-lg font-semibold"
        >
          {saving ? "💾 Đang lưu..." : "✅ Lưu thay đổi"}
        </button>
      </form>
    </main>
  );
}
