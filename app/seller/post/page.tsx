"use client";

import { useState, useRef, useEffect, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";

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
  const { user, loading, piReady } = useAuth();
  const { t } = useTranslation();

  const [role, setRole] = useState<string>("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<MessageState>({ text: "", type: "" });

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  /* CHECK LOGIN & ROLE */
  useEffect(() => {
    if (!loading && piReady) {
      if (!user) {
        router.push("/pilogin");
        return;
      }

      fetch(`/api/users/role?username=${user.username}`)
        .then((r) => r.json())
        .then((d) => {
          setRole(d.role);
          if (d.role !== "seller") router.push("/no-access");
        });
    }
  }, [loading, piReady, user, router]);

  /* LOAD CATEGORIES */
  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d: Category[]) => setCategories(d));
  }, []);

  if (loading || !piReady || !user || role !== "seller")
    return <main className="text-center py-10">⏳ {t.loading || "Đang tải..."}</main>;

  /* UPLOAD FILE */
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
      return null;
    }
  }

  /* MULTI IMAGE */
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImages((prev) => [...prev, ...files]);
    setPreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
  };

  const removeImage = (i: number) => {
    setImages((prev) => prev.filter((_, x) => x !== i));
    setPreviews((prev) => prev.filter((_, x) => x !== i));
  };

  /* SUBMIT PRODUCT */
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: "", type: "" });

    const form = e.currentTarget;
    const name = (form.name as HTMLInputElement).value.trim();
    const desc = (form.description as HTMLTextAreaElement).value.trim();
    const price = parseFloat((form.price as HTMLInputElement).value);
    const categoryId = parseInt((form.category as HTMLSelectElement).value);

    const salePrice = parseFloat((form.salePrice as HTMLInputElement).value) || null;
    const saleStart = toISO((form.saleStart as HTMLInputElement).value || null);
    const saleEnd = toISO((form.saleEnd as HTMLInputElement).value || null);

    if (!name || !price) {
      setMessage({ text: t.enter_valid_name_price || "⚠️ Nhập tên & giá hợp lệ!", type: "error" });
      setSaving(false);
      return;
    }

    // Upload images
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
        seller: user.username,
      }),
    });

    const data = await res.json();

    if (data.success) {
      setMessage({ text: t.post_success || "🎉 Đăng thành công!", type: "success" });
      setTimeout(() => router.push("/seller/stock"), 1000);
    } else {
      setMessage({ text: t.post_failed || "❌ Lỗi đăng sản phẩm", type: "error" });
    }

    setSaving(false);
  }

  return (
    <main className="p-5 max-w-lg mx-auto pb-32">
      <button
        onClick={() => router.back()}
        className="mb-4 text-orange-600 font-bold flex items-center gap-1"
      >
        ← {t.back || "Quay lại"}
      </button>

      <h1 className="text-xl font-bold mb-3">🛒 {t.post_product || "Đăng sản phẩm mới"}</h1>

      <p className="text-gray-500 text-center mb-3">
        👤 {t.seller || "Người bán"}: <b>{user.username}</b>
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

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label>{t.product_name || "Tên sản phẩm"}</label>
          <input name="name" className="w-full border p-2 rounded" required />
        </div>

        <div>
          <label>{t.category || "Danh mục"}</label>
          <select name="category" className="w-full border p-2 rounded" required>
            <option value="">{t.select_category || "-- Chọn danh mục --"}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label>{t.price || "Giá"}</label>
          <input name="price" type="number" step="any" className="w-full border p-2 rounded" required />
        </div>

        <div>
          <label>{t.sale_price || "Giá Sale"}</label>
          <input name="salePrice" type="number" className="w-full border p-2 rounded" />
        </div>

        <div>
          <label>{t.start_date || "Ngày bắt đầu"}</label>
          <input name="saleStart" type="date" className="w-full border p-2 rounded" />
        </div>

        <div>
          <label>{t.end_date || "Ngày kết thúc"}</label>
          <input name="saleEnd" type="date" className="w-full border p-2 rounded" />
        </div>

        <div>
          <label>{t.product_images || "Ảnh sản phẩm"}</label>
          <input type="file" multiple ref={fileInputRef} onChange={handleFileChange} />

          <div className="mt-3 space-y-2">
            {previews.map((url, i) => (
              <div key={i} className="flex gap-3 items-center">
                <img src={url} className="w-20 h-20 object-cover rounded border" />
                <button type="button" onClick={() => removeImage(i)} className="text-red-600">
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label>{t.description || "Mô tả"}</label>
          <textarea name="description" className="w-full border p-2 rounded"></textarea>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-orange-600 text-white p-3 rounded"
        >
          {saving ? t.posting || "Đang đăng..." : t.post_product || "Đăng sản phẩm"}
        </button>
      </form>
    </main>
  );
}
