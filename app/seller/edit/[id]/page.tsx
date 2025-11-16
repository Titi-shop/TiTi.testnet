"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useLanguage } from "../../../context/LanguageContext";
import { useAuth } from "@/context/AuthContext"; // ⭐ THÊM AUTH

export default function EditProductPage() {
  const { id } = useParams();
  const router = useRouter();
  const { translate } = useLanguage();
  const { user, loading, piReady } = useAuth(); // ⭐ LẤY TỪ AUTHCONTEXT

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

  /* ======================================================
     🔐 1) KIỂM TRA ĐĂNG NHẬP TỪ AUTHCONTEXT
  ====================================================== */
  useEffect(() => {
    if (!loading && piReady) {
      if (!user) {
        router.push("/pilogin");
        return;
      }
    }
  }, [loading, piReady, user, router]);

  /* ======================================================
     📌 2) TẢI DANH MỤC
  ====================================================== */
  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data));
  }, []);

  /* ======================================================
     📌 3) TẢI SẢN PHẨM
  ====================================================== */
  useEffect(() => {
    if (!id || !user) return;

    fetch("/api/products", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        const found = data.find((p: any) => String(p.id) === String(id));

        if (!found) {
          setMessage({ text: "❌ Không tìm thấy sản phẩm!", type: "error" });
          setLoadingPage(false);
          return;
        }

        // ⭐ KIỂM TRA ĐÚNG NGƯỜI BÁN
        if (
          found.seller?.trim().toLowerCase() !==
          user.username.trim().toLowerCase()
        ) {
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
  }, [id, user, router]);

  /* ======================================================
     📤 UPLOAD FILE
  ====================================================== */
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

  /* ======================================================
     📸 CHỌN ẢNH
  ====================================================== */
  const handleFileChange = (e: any) => {
    const files = Array.from(e.target.files);
    setImages((prev) => [...prev, ...files]);
    setPreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
  };

  const removeImage = (i: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== i));
    setPreviews((prev) => prev.filter((_, idx) => idx !== i));

    setProduct((prev: any) => ({
      ...prev,
      images: prev.images?.filter((_: any, idx: number) => idx !== i),
    }));
  };

  /* ======================================================
     💾 LƯU SẢN PHẨM
  ====================================================== */
  async function handleSave(e: any) {
    e.preventDefault();
    if (!product) return;

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
        seller: user.username, // ⭐ BẮT BUỘC ĐÚNG NGƯỜI BÁN
      }),
    });

    const result = await res.json();

    if (result.success) {
      setMessage({ text: "✅ Lưu thành công!", type: "success" });
      setTimeout(() => router.push("/seller/stock"), 1000);
    } else {
      setMessage({ text: result.message || "❌ Lỗi lưu sản phẩm!", type: "error" });
    }

    setSaving(false);
  }

  /* ======================================================
     LOADING
  ====================================================== */
  if (loading || !piReady || loadingPage)
    return <p className="text-center mt-10">⏳ Đang tải...</p>;

  if (!user)
    return <p className="text-center mt-10 text-red-500">Bạn chưa đăng nhập!</p>;

  if (!product)
    return <p className="text-center mt-10 text-red-500">Không tìm thấy sản phẩm!</p>;

  /* ======================================================
     UI
  ====================================================== */
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

        <div>
          <label>Tên sản phẩm</label>
          <input
            name="name"
            defaultValue={product.name}
            className="w-full border p-2 rounded"
          />
        </div>

        <div>
          <label>Giá (Pi)</label>
          <input
            name="price"
            type="number"
            defaultValue={product.price}
            className="w-full border p-2 rounded"
          />
        </div>

        <div>
          <label>Danh mục</label>
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

        <div>
          <label>Mô tả</label>
          <textarea
            name="description"
            defaultValue={product.description}
            className="w-full border p-2 rounded"
          />
        </div>

        <div>
          <label>Ảnh sản phẩm</label>
          <input type="file" multiple ref={fileInputRef} onChange={handleFileChange} />

          <div className="mt-3 space-y-2">
            {previews.map((url, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between bg-gray-50 p-2 border rounded"
              >
                <img src={url} className="w-16 h-16 object-cover rounded" />
                <button type="button" onClick={() => removeImage(idx)} className="text-red-600 font-bold">✕</button>
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-[#ff6600] text-white p-3 rounded-lg"
        >
          {saving ? "Đang lưu..." : "💾 Lưu thay đổi"}
        </button>
      </form>
    </main>
  );
}
