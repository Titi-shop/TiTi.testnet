"use client";

import {
  useState,
  useRef,
  useEffect,
  ChangeEvent,
  FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";

/* =========================
   TYPES
========================= */
interface Category {
  id: number;
  name: string;
}

interface MessageState {
  text: string;
  type: "success" | "error" | "";
}

/* =========================
   HELPERS
========================= */
function formatDateToInput(dateString: string | null) {
  if (!dateString) return "";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(d.getDate()).padStart(2, "0")}`;
}

/* =========================
   PAGE
========================= */
export default function SellerPostPage() {
  const router = useRouter();
  const { t } = useTranslation();

  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<MessageState>({
    text: "",
    type: "",
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  /* =========================
     LOAD CATEGORIES
  ========================= */
  useEffect(() => {
    fetch("/api/categories", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => setCategories(data || []));
  }, []);

  /* =========================
     UPLOAD FILE
  ========================= */
  async function handleFileUpload(file: File): Promise<string | null> {
    try {
      const arr = await file.arrayBuffer();
      const upload = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "x-filename": encodeURIComponent(file.name),
          "Content-Type": file.type,
        },
        body: arr,
      });
      const data = await upload.json();
      return data.url;
    } catch {
      return null;
    }
  }

  /* =========================
     IMAGE HANDLERS
  ========================= */
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImages((prev) => [...prev, ...files]);
    setPreviews((prev) => [
      ...prev,
      ...files.map((f) => URL.createObjectURL(f)),
    ]);
  };

  const removeImage = (i: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== i));
    setPreviews((prev) => prev.filter((_, idx) => idx !== i));
  };

  /* =========================
     SUBMIT
  ========================= */
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: "", type: "" });

    const form = e.currentTarget as HTMLFormElement;

    const payload = {
      name: (form.elements.namedItem("name") as HTMLInputElement).value.trim(),
      price: Number(
        (form.elements.namedItem("price") as HTMLInputElement).value
      ),
      description: (
        form.elements.namedItem("description") as HTMLTextAreaElement
      ).value,
      categoryId: Number(
        (form.elements.namedItem("categoryId") as HTMLSelectElement).value
      ),
      salePrice:
        Number(
          (form.elements.namedItem("salePrice") as HTMLInputElement).value
        ) || null,
      saleStart:
        (form.elements.namedItem("saleStart") as HTMLInputElement).value ||
        null,
      saleEnd:
        (form.elements.namedItem("saleEnd") as HTMLInputElement).value || null,
      images: [] as string[],
    };

    if (!payload.name || !payload.price) {
      setMessage({
        text: t.enter_valid_name_price || "⚠️ Nhập tên & giá hợp lệ!",
        type: "error",
      });
      setSaving(false);
      return;
    }

    const urls: string[] = [];
    for (const img of images) {
      const url = await handleFileUpload(img);
      if (url) urls.push(url);
    }

    payload.images = urls;

    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    const result = await res.json();

    if (res.ok) {
      setMessage({
        text: t.post_success || "🎉 Đăng thành công!",
        type: "success",
      });
      setTimeout(() => router.push("/seller/stock"), 1000);
    } else {
      setMessage({
        text: result.error || t.post_failed || "❌ Đăng thất bại",
        type: "error",
      });
    }

    setSaving(false);
  }

  /* =========================
     UI (GIỐNG EDIT)
  ========================= */
  return (
    <main className="max-w-lg mx-auto p-6 bg-white rounded-xl shadow mt-10 pb-32">
      <button
        className="mb-3 text-orange-600 font-bold text-lg"
        onClick={() => router.back()}
      >
        ← {t.back}
      </button>

      <h1 className="text-2xl font-bold text-center text-[#ff6600] mb-3">
        ➕ {t.post_product || "Đăng sản phẩm"}
      </h1>

      {message.text && (
        <p
          className={`text-center mb-2 ${
            message.type === "success"
              ? "text-green-600"
              : "text-red-500"
          }`}
        >
          {message.text}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label>{t.product_name}</label>
          <input name="name" className="w-full border p-2 rounded" />
        </div>

        <div>
          <label>{t.price_pi}</label>
          <input
            name="price"
            type="number"
            className="w-full border p-2 rounded"
          />
        </div>

        <div>
          <label>{t.category}</label>
          <select
            name="categoryId"
            className="w-full border p-2 rounded"
          >
            <option value="">{t.select_category}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* SALE */}
        <div className="p-3 bg-orange-50 border rounded">
          <h3 className="font-bold text-orange-600 mb-2">
            🔥 {t.sale}
          </h3>

          <label>{t.sale_price}</label>
          <input
            name="salePrice"
            type="number"
            className="w-full border p-2 rounded mb-2"
          />

          <label>{t.start_date}</label>
          <input
            name="saleStart"
            type="date"
            className="w-full border p-2 rounded mb-2"
          />

          <label>{t.end_date}</label>
          <input
            name="saleEnd"
            type="date"
            className="w-full border p-2 rounded"
          />
        </div>

        <div>
          <label>{t.description}</label>
          <textarea
            name="description"
            className="w-full border p-2 rounded"
          />
        </div>

        {/* IMAGES */}
        <div>
          <label>{t.product_images}</label>
          <input
            type="file"
            multiple
            ref={fileInputRef}
            onChange={handleFileChange}
          />

          <div className="mt-3 space-y-2">
            {previews.map((url, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between bg-gray-50 p-2 border rounded"
              >
                <img
                  src={url}
                  className="w-16 h-16 object-cover rounded"
                />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="text-red-600 font-bold"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        <button
          disabled={saving}
          className="w-full bg-[#ff6600] text-white p-3 rounded-lg mt-3"
        >
          {saving ? t.posting : "💾 " + t.post_product}
        </button>
      </form>
    </main>
  );
}
