"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

function toISO(dateString: string | null) {
  if (!dateString) return null;
  return new Date(dateString + "T00:00:00Z").toISOString();
}

export default function SellerPostPage() {
  const router = useRouter();
  const { user, loading, piReady } = useAuth();

  const [role, setRole] = useState<string>("");
  const [categories, setCategories] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  /* CHECK LOGIN */
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
      .then((d) => setCategories(d));
  }, []);

  if (loading || !piReady || !user || role !== "seller")
    return <main className="text-center py-10">⏳ Đang tải...</main>;

  /* UPLOAD FILE */
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

  /* MULTI IMAGE */
  const handleFileChange = (e: any) => {
    const files = Array.from(e.target.files);
    setImages((prev) => [...prev, ...files]);
    setPreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
  };

  const removeImage = (i: number) => {
    setImages((prev) => prev.filter((_, x) => x !== i));
    setPreviews((prev) => prev.filter((_, x) => x !== i));
  };

  /* SUBMIT PRODUCT */
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
    const saleStart = toISO(form.saleStart.value || null);
    const saleEnd = toISO(form.saleEnd.value || null);

    if (!name || !price) {
      setMessage({ text: "⚠️ Nhập tên & giá hợp lệ!", type: "error" });
      setSaving(false);
      return;
    }

    // Upload all images
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
      setMessage({ text: "🎉 Đăng thành công!", type: "success" });
      setTimeout(() => router.push("/seller/stock"), 1000);
    } else {
      setMessage({ text: "❌ Lỗi đăng sản phẩm", type: "error" });
    }

    setSaving(false);
  }

  return (
    <main className="p-5 max-w-lg mx-auto pb-32">
      <button
        onClick={() => router.back()}
        className="mb-4 text-orange-600 font-bold flex items-center gap-1"
      >
        ← Quay lại
      </button>

      <h1 className="text-xl font-bold mb-3">🛒 Đăng sản phẩm mới</h1>

      <p className="text-gray-500 text-center mb-3">
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
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Giá</label>
          <input name="price" type="number" step="any" className="w-full border p-2 rounded" required />
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
          <input type="file" multiple ref={fileInputRef} onChange={handleFileChange} />
          <div className="mt-3 space-y-2">
            {previews.map((url, i) => (
              <div key={i} className="flex gap-3 items-center">
                <img src={url} className="w-20 h-20 object-cover rounded border" />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="text-red-600"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label>Mô tả</label>
          <textarea name="description" className="w-full border p-2 rounded"></textarea>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-orange-600 text-white p-3 rounded"
        >
          {saving ? "Đang đăng..." : "Đăng sản phẩm"}
        </button>
      </form>
    </main>
  );
}
