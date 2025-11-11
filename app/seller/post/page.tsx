"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "@/context/AuthContext";

export default function SellerPostPage() {
  const { translate } = useLanguage();
  const { user, piReady } = useAuth();
  const router = useRouter();

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" | "" }>({
    text: "",
    type: "",
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [selectedPreview, setSelectedPreview] = useState<string | null>(null);

  useEffect(() => {
    if (piReady && !user) router.push("/pilogin");
  }, [piReady, user, router]);

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
      return data.url || null;
    } catch {
      setMessage({ text: "Không thể tải ảnh lên.", type: "error" });
      return null;
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    setImages((prev) => [...prev, ...files]);
    setPreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setMessage({ text: "", type: "" });

    const form = e.currentTarget;
    const name = (form.name as any).value.trim();
    const desc = (form.description as any).value.trim();
    const price = parseFloat((form.price as any).value);

    if (!name || isNaN(price) || price <= 0) {
      setMessage({ text: "⚠️ Nhập tên và giá hợp lệ!", type: "error" });
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
      body: JSON.stringify({ name, price, description: desc, images: urls, seller: user.username }),
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

  if (!piReady || !user)
    return <main className="text-center py-10">⏳ Đang tải...</main>;

  return (
    <main className="p-5 max-w-lg mx-auto">
      <h1 className="text-xl font-bold mb-3">
        🛒 {translate("post_product") || "Đăng sản phẩm mới"}
      </h1>
      <p className="text-gray-500 text-center mb-3">
        👤 Người bán: <b>{user.username}</b>
      </p>

      {message.text && (
        <p
          className={`text-center mb-2 font-medium ${
            message.type === "success" ? "text-green-600" : "text-red-500"
          }`}
        >
          {message.text}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium mb-1">Tên sản phẩm</label>
          <input name="name" type="text" required className="w-full border rounded p-2" />
        </div>

        <div>
          <label className="block font-medium mb-1">Giá (Pi)</label>
          <input name="price" type="number" min="0.000001" step="any" required className="w-full border rounded p-2" />
        </div>

        <div>
          <label className="block font-medium mb-1">Mô tả sản phẩm</label>
          <textarea name="description" rows={3} className="w-full border rounded p-2" />
        </div>

        {/* Upload ảnh */}
        <div>
          <label className="block font-medium mb-2">Ảnh sản phẩm</label>
          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileChange} />
          <div className="mt-3 space-y-2">
            {previews.map((url, idx) => (
              <div key={idx} className="flex items-center justify-between bg-gray-100 p-2 rounded">
                <div onClick={() => setSelectedPreview(url)} className="flex items-center gap-3 cursor-pointer">
                  <img src={url} alt={`preview-${idx}`} className="w-[70px] h-[70px] object-cover rounded border" />
                  <span className="text-gray-700 text-sm truncate">{images[idx]?.name}</span>
                </div>
                <button type="button" onClick={() => removeImage(idx)} className="text-purple-600 font-bold px-2">
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {selectedPreview && (
          <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center" onClick={() => setSelectedPreview(null)}>
            <img src={selectedPreview} alt="preview-large" className="max-w-[90%] max-h-[80%] rounded-lg shadow-lg" />
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
