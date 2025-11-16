"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "../../../context/LanguageContext";
import { useAuth } from "@/context/AuthContext";

export default function SellerPostPage() {
  const router = useRouter();
  const { translate } = useLanguage();
  const { user, loading, piReady, role } = useAuth();

  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [message, setMessage] = useState({ text: "", type: "" });

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  /* ========== BẢO VỆ SELLER ========== */
  useEffect(() => {
    if (!loading && piReady) {
      if (!user) router.push("/pilogin");
      else if (role !== "seller") router.push("/no-access");
    }
  }, [loading, piReady, user, role, router]);

  /* ========== LOAD CATEGORY ========== */
  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d));
  }, []);

  if (loading || !piReady || !user || role !== "seller")
    return <main className="text-center py-10">⏳ Đang tải...</main>;

  /* ========== UPLOAD FILE ========== */
  async function handleFileUpload(file: File) {
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
      return null;
    }
  }

  /* ========== HANDLE CHANGE FILES ========== */
  const handleFileChange = (e: any) => {
    const files = Array.from(e.target.files);
    setImages((p) => [...p, ...files]);
    setPreviews((p) => [...p, ...files.map((f) => URL.createObjectURL(f))]);
  };

  const removeImage = (i: number) => {
    setImages((p) => p.filter((_, x) => x !== i));
    setPreviews((p) => p.filter((_, x) => x !== i));
  };

  /* ========== HANDLE SUBMIT PRODUCT ========== */
  async function handleSubmit(e: any) {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: "", type: "" });

    const form = e.target;
    const name = form.name.value.trim();
    const desc = form.description.value.trim();
    const price = parseFloat(form.price.value);
    const categoryId = parseInt(form.category.value);

    const salePrice = parseFloat(form.salePrice.value) || null;
    const saleStart = form.saleStart.value || null;
    const saleEnd = form.saleEnd.value || null;

    if (!name || !price) {
      setMessage({ text: "⚠️ Nhập tên & giá hợp lệ!", type: "error" });
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
        categoryId,
        salePrice,
        saleStart,
        saleEnd,
        images: urls,
        seller: user.username, // ⭐ QUAN TRỌNG
      }),
    });

    const data = await res.json();

    if (data.success) {
      setMessage({ text: "Đăng thành công!", type: "success" });
      setTimeout(() => router.push("/seller/stock"), 1000);
    } else {
      setMessage({ text: "Lỗi đăng sản phẩm", type: "error" });
    }

    setSaving(false);
  }

  /* ========== RENDER FORM ========== */
  return (
    <main className="p-5 max-w-lg mx-auto pb-32">
      <h1 className="text-xl font-bold mb-3">🛒 Đăng sản phẩm mới</h1>
      <p className="text-gray-500 text-center mb-3">👤 Người bán: <b>{user.username}</b></p>

      {message.text && (
        <p className={`text-center mb-2 ${message.type === "success" ? "text-green-600" : "text-red-500"}`}>
          {message.text}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label>Tên sản phẩm</label>
          <input name="name" className="w-full border p-2 rounded" required />
        </div>

        <div>
          <label>Danh mục</label>
          <select name="category" className="w-full border p-2 rounded" required>
            <option value="">-- Chọn danh mục --</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label>Giá</label>
          <input name="price" type="number" step="any" className="w-full border p-2 rounded" />
        </div>

        <div>
          <label>Giá Sale</label>
          <input name="salePrice" type="number" className="w-full border p-2 rounded" />
        </div>

        <div>
          <label>Ngày bắt đầu</label>
          <input name="saleStart" type="date" className="w-full border p-2 rounded" />
        </div>

        <div>
          <label>Ngày kết thúc</label>
          <input name="saleEnd" type="date" className="w-full border p-2 rounded" />
        </div>

        <div>
          <label>Ảnh sản phẩm</label>
          <input ref={fileInputRef} type="file" multiple onChange={handleFileChange} />
          <div className="mt-3 space-y-2">
            {previews.map((url, i) => (
              <div key={i} className="flex gap-3 items-center">
                <img src={url} className="w-20 h-20 object-cover rounded" />
                <button type="button" onClick={() => removeImage(i)}>✕</button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label>Mô tả</label>
          <textarea name="description" className="w-full border rounded p-2"></textarea>
        </div>

        <button className="w-full bg-orange-600 text-white p-3 rounded" disabled={saving}>
          {saving ? "Đang đăng..." : "Đăng sản phẩm"}
        </button>
      </form>
    </main>
  );
}
