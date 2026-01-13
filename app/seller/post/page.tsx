"use client";

import { useState, useRef, useEffect, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";
import { useAuth } from "@/context/AuthContext";

interface Category {
  id: number;
  name: string;
}

interface MessageState {
  text: string;
  type: "success" | "error" | "";
}

function toISO(dateString: string | null) {
  if (!dateString) return null;
  return new Date(dateString + "T00:00:00Z").toISOString();
}

export default function SellerPostPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { piToken } = useAuth(); // ✅ THÊM

  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<MessageState>({ text: "", type: "" });

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  /* LOAD CATEGORIES */
  useEffect(() => {
    fetch("/api/categories")
      .then(r => r.json())
      .then(setCategories);
  }, []);

  /* UPLOAD FILE */
  async function handleFileUpload(file: File): Promise<string | null> {
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "x-filename": encodeURIComponent(file.name),
          "Content-Type": file.type || "application/octet-stream",
        },
        body: await file.arrayBuffer(),
      });

      const data = await res.json();
      return data.url || null;
    } catch {
      return null;
    }
  }

  /* SUBMIT PRODUCT */
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: "", type: "" });

    const form = e.currentTarget as HTMLFormElement & {
      name: { value: string };
      description: { value: string };
      price: { value: string };
      category: { value: string };
      salePrice: { value: string };
      saleStart: { value: string };
      saleEnd: { value: string };
    };

    const name = form.name.value.trim();
    const desc = form.description.value.trim();
    const price = parseFloat(form.price.value);
    const categoryId = Number(form.category.value);

    const salePrice = Number(form.salePrice.value) || null;
    const saleStart = toISO(form.saleStart.value || null);
    const saleEnd = toISO(form.saleEnd.value || null);

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
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(piToken ? { Authorization: `Bearer ${piToken}` } : {}),
      },
      body: JSON.stringify({
        name,
        price,
        description: desc,
        categoryId,
        salePrice,
        saleStart,
        saleEnd,
        images: urls,
      }),
    });

    const data = await res.json();

    if (res.ok) {
      setMessage({ text: "🎉 Đăng thành công!", type: "success" });
      setTimeout(() => router.push("/seller/stock"), 1000);
    } else {
      setMessage({
        text: data?.error || "❌ Không có quyền đăng sản phẩm",
        type: "error",
      });
    }

    setSaving(false);
  }

  return (
    <main className="p-5 max-w-lg mx-auto pb-32">
      <button onClick={() => router.back()} className="mb-4 text-orange-600 font-bold">
        ← Quay lại
      </button>

      <h1 className="text-xl font-bold mb-3">🛒 Đăng sản phẩm mới</h1>

      {message.text && (
        <p className={`text-center mb-2 ${message.type === "success" ? "text-green-600" : "text-red-500"}`}>
          {message.text}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input name="name" placeholder="Tên sản phẩm" className="w-full border p-2 rounded" />
        <select name="category" className="w-full border p-2 rounded">
          <option value="">-- Chọn danh mục --</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <input name="price" type="number" className="w-full border p-2 rounded" />
        <input type="file" multiple ref={fileInputRef} onChange={e => setImages(Array.from(e.target.files || []))} />
        <button disabled={saving} className="w-full bg-orange-600 text-white p-3 rounded">
          {saving ? "Đang đăng..." : "Đăng sản phẩm"}
        </button>
      </form>
    </main>
  );
}
