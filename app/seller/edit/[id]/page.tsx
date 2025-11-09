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
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" | "" }>({
    text: "",
    type: "",
  });
  const [sellerUser, setSellerUser] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [selectedPreview, setSelectedPreview] = useState<string | null>(null);

  // ✅ Xác thực người dùng Pi
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

  // ✅ Lấy thông tin sản phẩm
  useEffect(() => {
    if (!id) return;
    fetch("/api/products", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        const found = data.find((p: any) => String(p.id) === String(id));
        if (found) {
          setProduct(found);
          setPreviews(found.images || []);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("❌ Lỗi tải sản phẩm:", err);
        setMessage({ text: "Không thể tải thông tin sản phẩm.", type: "error" });
        setLoading(false);
      });
  }, [id]);

  // ✅ Upload ảnh
  async function handleFileUpload(file: File): Promise<string | null> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "x-filename": encodeURIComponent(file.name),
          "Content-Type": file.type || "application/octet-stream",
        },
        body: arrayBuffer,
      });

      const data = await res.json();
      if (data.url) return data.url;
      throw new Error("Upload thất bại");
    } catch (err) {
      console.error("❌ Upload lỗi:", err);
      setMessage({ text: "Không thể tải ảnh lên.", type: "error" });
      return null;
    }
  }

  // ✅ Khi chọn thêm ảnh
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    setImages((prev) => [...prev, ...files]);
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews((prev) => [...prev, ...urls]);
  };

  // ✅ Xoá ảnh khỏi danh sách
  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
    setProduct((prev: any) => ({
      ...prev,
      images: prev.images?.filter((_: any, i: number) => i !== index),
    }));
  };

  // ✅ Lưu chỉnh sửa
  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: "", type: "" });

    const form = e.currentTarget;
    let rawPrice = (form.price as any).value;
    rawPrice = rawPrice.replace(",", ".");
    const price = parseFloat(rawPrice);
    const name = (form.name as any).value.trim();
    const description = (form.description as any).value.trim();

    if (isNaN(price) || price <= 0) {
      setMessage({ text: "⚠️ Giá không hợp lệ.", type: "error" });
      setSaving(false);
      return;
    }

    // Upload ảnh mới nếu có
    const newUrls: string[] = [];
    for (const img of images) {
      const url = await handleFileUpload(img);
      if (url) newUrls.push(url);
    }

    const allImages = [...(product.images || []), ...newUrls];

    try {
      const res = await fetch("/api/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: product.id,
          name,
          price,
          description,
          images: allImages,
          seller: sellerUser,
        }),
      });

      const result = await res.json();
      if (result.success) {
        setMessage({ text: "✅ Cập nhật sản phẩm thành công!", type: "success" });
        setTimeout(() => router.push("/seller/stock"), 1500);
      } else {
        setMessage({
          text: result.message || "❌ Không thể cập nhật sản phẩm.",
          type: "error",
        });
      }
    } catch (err) {
      console.error("❌ PUT error:", err);
      setMessage({ text: "Lỗi khi lưu sản phẩm.", type: "error" });
    } finally {
      setSaving(false);
    }
  }

  if (loading)
    return <p className="text-center mt-10 text-gray-600">⏳ Đang tải dữ liệu...</p>;

  if (!product)
    return <p className="text-center mt-10 text-red-500">Không tìm thấy sản phẩm!</p>;

  return (
    <main className="max-w-lg mx-auto p-6 bg-white rounded-xl shadow mt-10 pb-32">
      <h1 className="text-2xl font-bold mb-4 text-center text-[#ff6600]">
        ✏️ {translate("edit_product") || "Chỉnh sửa sản phẩm"}
      </h1>

      <p className="text-center text-gray-500 mb-3">
        👤 Người bán: <b>{sellerUser}</b>
      </p>

      {message.text && (
        <p
          className={`text-center font-medium mb-2 ${
            message.type === "success" ? "text-green-600" : "text-red-500"
          }`}
        >
          {message.text}
        </p>
      )}

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
            step="any"
            min="0.000001"
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

        {/* ✅ Ảnh sản phẩm */}
        <div>
          <label className="block font-medium mb-2">Ảnh sản phẩm</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="w-full"
          />

          <div className="mt-3 space-y-2">
            {previews.map((url, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between bg-gray-100 rounded-md p-2"
              >
                <div
                  onClick={() => setSelectedPreview(url)}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <img
                    src={url}
                    alt={`preview-${idx}`}
                    className="w-[70px] h-[70px] object-cover rounded-md border border-gray-300"
                  />
                  <span className="text-gray-700 text-sm truncate">
                    {product.images?.[idx]?.split("/").pop() || `Ảnh ${idx + 1}`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="text-purple-600 text-lg font-bold px-2"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Preview lớn */}
        {selectedPreview && (
          <div
            className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
            onClick={() => setSelectedPreview(null)}
          >
            <img
              src={selectedPreview}
              alt="preview-large"
              className="max-w-[90%] max-h-[80%] rounded-lg shadow-lg"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-[#ff6600] hover:bg-[#e65500] text-white p-3 rounded-lg font-semibold"
        >
          {saving ? "💾 Đang lưu..." : "✅ Lưu thay đổi"}
        </button>
      </form>
    </main>
  );
}
