"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "../../context/LanguageContext";

export default function SellerPostPage() {
  const { translate } = useLanguage();
  const router = useRouter();
  const [sellerUser, setSellerUser] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" | "" }>({
    text: "",
    type: "",
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [selectedPreview, setSelectedPreview] = useState<string | null>(null);

  // ✅ Xác thực Pi login
  useEffect(() => {
    try {
      const stored = localStorage.getItem("pi_user");
      const logged = localStorage.getItem("titi_is_logged_in");
      if (!stored || logged !== "true") {
        router.push("/pilogin");
        return;
      }
      const parsed = JSON.parse(stored);
      const username = (parsed?.user?.username || parsed?.username || "").trim().toLowerCase();
      setSellerUser(username);
    } catch (err) {
      console.error("❌ Lỗi xác thực Pi:", err);
      router.push("/pilogin");
    }
  }, [router]);

  // ✅ Cắt ảnh về kích thước đồng đều (60x70)
  async function resizeImage(file: File, width = 70, height = 70): Promise<File> {
    const img = document.createElement("img");
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    const url = URL.createObjectURL(file);
    await new Promise((res) => (img.onload = res, img.src = url));

    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(img, 0, 0, width, height);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(new File([blob], file.name, { type: file.type }));
        else resolve(file);
      }, file.type);
    });
  }

  // ✅ Upload ảnh
  async function handleFileUpload(file: File): Promise<string | null> {
    try {
      const resized = await resizeImage(file);
      const arrayBuffer = await resized.arrayBuffer();
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "x-filename": encodeURIComponent(resized.name),
          "Content-Type": resized.type || "application/octet-stream",
        },
        body: arrayBuffer,
      });
      const data = await res.json();
      return data.url || null;
    } catch (err) {
      console.error("❌ Upload lỗi:", err);
      setMessage({ text: "Không thể tải ảnh lên.", type: "error" });
      return null;
    }
  }

  // ✅ Khi chọn file
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    setImages((prev) => [...prev, ...files]);
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews((prev) => [...prev, ...urls]);
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // ✅ Đăng sản phẩm
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: "", type: "" });

    const form = e.currentTarget;
    const name = (form.name as any).value.trim();
    const desc = (form.description as any).value.trim();
    const rawPrice = (form.price as any).value.replace(",", ".");
    const price = parseFloat(rawPrice);

    if (isNaN(price) || price <= 0) {
      setMessage({ text: "⚠️ Vui lòng nhập giá hợp lệ.", type: "error" });
      setSaving(false);
      return;
    }

    if (images.length === 0) {
      setMessage({ text: "Vui lòng chọn ít nhất một ảnh.", type: "error" });
      setSaving(false);
      return;
    }

    const urls: string[] = [];
    for (const img of images) {
      const url = await handleFileUpload(img);
      if (url) urls.push(url);
    }

    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        price,
        description: desc,
        images: urls,
        seller: sellerUser,
      }),
    });

    const data = await res.json();
    if (data.success) {
      setMessage({ text: "✅ Đăng sản phẩm thành công!", type: "success" });
      setTimeout(() => router.push("/seller/stock"), 1500);
    } else {
      setMessage({ text: "❌ Lỗi khi đăng sản phẩm.", type: "error" });
    }
    setSaving(false);
  };

  return (
    <main className="max-w-lg mx-auto p-6 pb-32 bg-white shadow rounded-lg mt-8">
      <h1 className="text-2xl font-bold text-center mb-4 text-[#ff6600]">
        🛒 {translate("post_product") || "Đăng sản phẩm mới"}
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

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium mb-1">Tên sản phẩm</label>
          <input name="name" type="text" required className="w-full border rounded-md p-2" />
        </div>

        <div>
          <label className="block font-medium mb-1">Giá (Pi)</label>
          <input
            name="price"
            type="number"
            step="any"
            min="0.000001"
            required
            className="w-full border rounded-md p-2"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Mô tả sản phẩm</label>
          <textarea name="description" rows={3} className="w-full border rounded-md p-2" />
        </div>

        {/* Upload ảnh */}
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

          {/* ✅ Khung hiển thị ảnh */}
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
                    className="w-16 h-16 object-cover rounded-md border border-gray-300"
                  />
                  <span className="text-gray-700 text-sm truncate">
                    {images[idx]?.name}
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

            {previews.length > 0 && (
              <label className="text-[#ff6600] cursor-pointer block mt-1">
                + Thêm ảnh khác
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            )}
          </div>
        </div>

        {/* Xem ảnh lớn */}
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
          className="w-full bg-[#ff6600] hover:bg-[#e65500] text-white py-3 rounded-lg font-semibold"
        >
          {saving ? "⏳ Đang đăng..." : "📦 Đăng sản phẩm"}
        </button>
      </form>
    </main>
  );
}
