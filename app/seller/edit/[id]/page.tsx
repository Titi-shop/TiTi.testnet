"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useLanguage } from "../../../context/LanguageContext";
import { useAuth } from "@/context/AuthContext";

export default function EditProductPage() {
  const { id } = useParams();
  const router = useRouter();
  const { translate } = useLanguage();
  const { user, loading, piReady } = useAuth();

  const [product, setProduct] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingPage, setLoadingPage] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState({
    text: "",
    type: "",
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  /* ======================
      AUTH CHECK
  ====================== */
  useEffect(() => {
    if (!loading && piReady) {
      if (!user) {
        router.push("/pilogin");
      }
    }
  }, [loading, piReady, user]);

  /* ======================
      LOAD CATEGORIES
  ====================== */
  useEffect(() => {
    fetch("/api/categories")
      .then(r => r.json())
      .then(data => setCategories(data));
  }, []);

  /* ======================
      LOAD PRODUCT
  ====================== */
  useEffect(() => {
    if (!id || !user) return;

    fetch("/api/products", { cache: "no-store" })
      .then(r => r.json())
      .then(data => {
        const found = data.find((p: any) => String(p.id) === String(id));

        if (!found) {
          setMessage({ text: "❌ Không tìm thấy sản phẩm!", type: "error" });
          setLoadingPage(false);
          return;
        }

        // CHECK OWNER
        if (found.seller?.trim().toLowerCase() !== user.username.trim().toLowerCase()) {
          setMessage({
            text: "🚫 Bạn không có quyền sửa sản phẩm này!",
            type: "error",
          });
          setTimeout(() => router.push("/seller/stock"), 2000);
          return;
        }

        setProduct(found);
        setPreviews(found.images || []);
      })
      .finally(() => setLoadingPage(false));
  }, [id, user]);

  /* ======================
      UPLOAD FILE
  ====================== */
  async function handleFileUpload(file: File): Promise<string | null> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const upload = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "x-filename": encodeURIComponent(file.name),
          "Content-Type": file.type,
        },
        body: arrayBuffer,
      });
      const data = await upload.json();
      return data.url;
    } catch {
      return null;
    }
  }

  /* ======================
      IMAGE CHANGE
  ====================== */
  const handleFileChange = (e: any) => {
    const files = Array.from(e.target.files);
    setImages(prev => [...prev, ...files]);
    setPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
  };

  const removeImage = (i: number) => {
    setPreviews(p => p.filter((_, idx) => idx !== i));

    setProduct(prev => ({
      ...prev,
      images: prev?.images?.filter((_: any, idx: number) => idx !== i) || [],
    }));
  };

  /* ======================
      SAVE PRODUCT
  ====================== */
  async function handleSave(e: any) {
    e.preventDefault();
    setSaving(true);

    const form = e.target;

    const name = form.name.value.trim();
    const price = Number(form.price.value);
    const description = form.description.value;
    const categoryId = Number(form.categoryId.value);

    const salePrice = Number(form.salePrice.value) || null;
    const saleStart = form.saleStart.value || null;
    const saleEnd = form.saleEnd.value || null;

    // Upload ảnh mới
    const newUrls: string[] = [];
    for (const f of images) {
      const url = await handleFileUpload(f);
      if (url) newUrls.push(url);
    }

    const allImages = [...(product.images || []), ...newUrls];

    const res = await fetch("/api/products", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: product.id,
        name,
        price,
        description,
        categoryId,
        salePrice,
        saleStart,
        saleEnd,
        images: allImages,
        seller: user.username,
      }),
    });

    const result = await res.json();

    if (result.success) {
      setMessage({ text: "✅ Lưu thành công!", type: "success" });
      setTimeout(() => router.push("/seller/stock"), 1000);
    } else {
      setMessage({ text: "❌ Lỗi lưu sản phẩm!", type: "error" });
    }

    setSaving(false);
  }

  /* ======================
      UI
  ====================== */
  if (loadingPage || loading || !piReady)
    return <p className="text-center mt-10">⏳ Đang tải...</p>;

  if (!product)
    return <p className="text-center mt-10 text-red-500">❌ Không tìm thấy sản phẩm!</p>;

  return (
    <main className="max-w-lg mx-auto p-6 bg-white rounded-xl shadow mt-10 pb-32">
      <h1 className="text-2xl font-bold text-center text-[#ff6600] mb-3">
        ✏️ Chỉnh sửa sản phẩm
      </h1>

      <p className="text-center text-gray-500 mb-3">
        👤 Người bán: <b>{user.username}</b>
      </p>

      {message.text && (
        <p className={`text-center mb-2 ${message.type === "success" ? "text-green-600" : "text-red-500"}`}>
          {message.text}
        </p>
      )}

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label>Tên sản phẩm</label>
          <input name="name" defaultValue={product.name} className="w-full border p-2 rounded" />
        </div>

        <div>
          <label>Giá (Pi)</label>
          <input name="price" type="number" defaultValue={product.price} className="w-full border p-2 rounded" />
        </div>

        <div>
          <label>Danh mục</label>
          <select name="categoryId" defaultValue={product.categoryId || ""} className="w-full border p-2 rounded">
            <option value="">— Chọn danh mục —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* 🔥 SALE */}
        <div className="p-3 bg-orange-50 border rounded">
          <h3 className="font-bold text-orange-600 mb-2">🔥 Giảm giá</h3>

          <label>Giá sale</label>
          <input
            name="salePrice"
            type="number"
            defaultValue={product.salePrice || ""}
            className="w-full border p-2 rounded mb-2"
          />

          <label>Ngày bắt đầu</label>
          <input
            name="saleStart"
            type="date"
            defaultValue={product.saleStart || ""}
            className="w-full border p-2 rounded mb-2"
          />

          <label>Ngày kết thúc</label>
          <input
            name="saleEnd"
            type="date"
            defaultValue={product.saleEnd || ""}
            className="w-full border p-2 rounded"
          />
        </div>

        <div>
          <label>Mô tả</label>
          <textarea name="description" defaultValue={product.description} className="w-full border p-2 rounded" />
        </div>

        <div>
          <label>Ảnh sản phẩm</label>
          <input type="file" multiple ref={fileInputRef} onChange={handleFileChange} />

          <div className="mt-3 space-y-2">
            {previews.map((url, idx) => (
              <div key={idx} className="flex items-center justify-between bg-gray-50 p-2 border rounded">
                <img src={url} className="w-16 h-16 object-cover rounded" />
                <button type="button" onClick={() => removeImage(idx)} className="text-red-600 font-bold">✕</button>
              </div>
            ))}
          </div>
        </div>

        <button
          disabled={saving}
          className="w-full bg-[#ff6600] text-white p-3 rounded-lg mt-3"
        >
          {saving ? "Đang lưu..." : "💾 Lưu thay đổi"}
        </button>
      </form>
    </main>
  );
}
