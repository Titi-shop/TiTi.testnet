"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useLanguage } from "../../../context/LanguageContext";
import { useAuth } from "@/context/AuthContext";   // ⭐ THÊM AUTH

export default function EditProductPage() {
  const { id } = useParams();
  const router = useRouter();
  const { translate } = useLanguage();

  const { user, loading: authLoading, piReady } = useAuth();  // ⭐ THÊM
  const [product, setProduct] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" | "" }>({
    text: "",
    type: "",
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [selectedPreview, setSelectedPreview] = useState<string | null>(null);

  /* ============================
     📌 KIỂM TRA ĐĂNG NHẬP
  ============================ */
  useEffect(() => {
    if (!authLoading && piReady && !user) {
      router.push("/pilogin");
    }
  }, [authLoading, piReady, user, router]);

  /* ============================
     📌 TẢI DANH MỤC
  ============================ */
  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data));
  }, []);

  /* ============================
     📌 LẤY THÔNG TIN SẢN PHẨM
  ============================ */
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
      .catch(() => {
        setMessage({ text: "Không thể tải thông tin.", type: "error" });
        setLoading(false);
      });
  }, [id]);

  /* ================================
     ⭐ SAU KHI LOAD DATA → KIỂM TRA SELLER
  ================================= */
  if (!authLoading && user && product) {
    const productSeller = String(product.seller || "").toLowerCase();
    const currentUser = String(user.username || "").toLowerCase();

    if (productSeller !== currentUser) {
      return (
        <main className="text-center mt-10 text-red-600">
          ❌ Bạn không có quyền chỉnh sửa sản phẩm này!
        </main>
      );
    }
  }

  /* ============================
     📌 UPLOAD ẢNH
  ============================ */
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
      setMessage({ text: "Không thể tải ảnh.", type: "error" });
      return null;
    }
  }

  /* ============================
     📌 CHỌN ẢNH
  ============================ */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);

    setImages((prev) => [...prev, ...files]);
    setPreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
  };

  /* ============================
     📌 XOÁ ẢNH
  ============================ */
  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
    setProduct((prev: any) => ({
      ...prev,
      images: prev.images?.filter((_: any, i: number) => i !== index),
    }));
  };

  /* ============================
     📌 LƯU SẢN PHẨM
  ============================ */
  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);

    const form = e.currentTarget;

    const name = form.name.value.trim();
    const price = Number(form.price.value || 0);

    const salePrice = Number(form.salePrice.value || 0);
    const saleStart = form.saleStart.value;
    const saleEnd = form.saleEnd.value;

    const description = form.description.value;
    const categoryId = Number(form.categoryId.value);

    if (price <= 0) {
      setMessage({ text: "⚠️ Giá không hợp lệ.", type: "error" });
      setSaving(false);
      return;
    }

    // Upload file
    const uploaded: string[] = [];
    for (const img of images) {
      const url = await handleFileUpload(img);
      if (url) uploaded.push(url);
    }

    const allImages = [...(product.images || []), ...uploaded];

    const res = await fetch("/api/products", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: product.id,
        name,
        price,
        salePrice: salePrice > 0 ? salePrice : null,
        saleStart,
        saleEnd,
        description,
        categoryId,
        images: allImages,
        seller: user.username,     // ⭐ GIỮ SELLER TỪ AUTH
      }),
    });

    const result = await res.json();

    if (result.success) {
      setMessage({ text: "✅ Lưu thành công!", type: "success" });
      setTimeout(() => router.push("/seller/stock"), 1000);
    } else {
      setMessage({ text: result.message || "Không thể lưu.", type: "error" });
    }

    setSaving(false);
  }

  /* ============================
     📌 GIAO DIỆN
  ============================ */

  if (loading || authLoading)
    return <p className="text-center mt-10">⏳ Đang tải...</p>;

  if (!product)
    return <p className="text-center mt-10 text-red-500">Không tìm thấy sản phẩm!</p>;

  return (
    <main className="max-w-lg mx-auto p-6 bg-white rounded-xl shadow mt-10 pb-32">
      <h1 className="text-2xl font-bold text-center text-[#ff6600] mb-3">
        ✏️ Chỉnh sửa sản phẩm
      </h1>

      <p className="text-center text-gray-500 mb-3">
        👤 Người bán: <b>{user.username}</b>
      </p>

      {message.text && (
        <p
          className={`text-center mb-2 ${
            message.type === "success" ? "text-green-600" : "text-red-500"
          }`}
        >
          {message.text}
        </p>
      )}

      <form onSubmit={handleSave} className="space-y-4">

        {/* Tên */}
        <div>
          <label className="font-medium">Tên sản phẩm</label>
          <input name="name" defaultValue={product.name} className="w-full border p-2 rounded" />
        </div>

        {/* Giá */}
        <div>
          <label className="font-medium">Giá (Pi)</label>
          <input name="price" type="number" defaultValue={product.price} className="w-full border p-2 rounded" />
        </div>

        {/* ⭐ DANH MỤC ⭐ */}
        <div>
          <label className="font-medium">Danh mục sản phẩm</label>
          <select
            name="categoryId"
            defaultValue={product.categoryId || ""}
            className="w-full border p-2 rounded"
          >
            <option value="">— Chọn danh mục —</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        {/* SALE */}
        <div className="p-4 border rounded bg-orange-50">
          <h3 className="font-semibold text-orange-600 mb-2">🔥 SALE</h3>

          <label>Giá sale</label>
          <input name="salePrice" type="number" defaultValue={product.salePrice || ""} className="w-full border p-2 rounded mb-2" />

          <label>Ngày bắt đầu</label>
          <input name="saleStart" type="date" defaultValue={product.saleStart || ""} className="w-full border p-2 rounded mb-2" />

          <label>Ngày kết thúc</label>
          <input name="saleEnd" type="date" defaultValue={product.saleEnd || ""} className="w-full border p-2 rounded" />
        </div>

        {/* Mô tả */}
        <div>
          <label className="font-medium">Mô tả</label>
          <textarea name="description" defaultValue={product.description} className="w-full border p-2 rounded"></textarea>
        </div>

        {/* Ảnh */}
        <div>
          <label className="font-medium">Ảnh sản phẩm</label>
          <input ref={fileInputRef} type="file" multiple onChange={handleFileChange} className="w-full" />

          <div className="mt-3 space-y-2">
            {previews.map((url, idx) => (
              <div key={idx} className="flex items-center justify-between bg-gray-50 p-2 border rounded">
                <img src={url} className="w-16 h-16 object-cover rounded" />
                <button type="button" onClick={() => removeImage(idx)} className="text-red-600 font-bold">✕</button>
              </div>
            ))}
          </div>
        </div>

        <button type="submit" disabled={saving} className="w-full bg-[#ff6600] text-white p-3 rounded-lg mt-3">
          {saving ? "Đang lưu..." : "💾 Lưu thay đổi"}
        </button>
      </form>
    </main>
  );
}
