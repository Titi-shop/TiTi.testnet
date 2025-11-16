"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useLanguage } from "../../../context/LanguageContext";
import { useAuth } from "@/context/AuthContext";

export default function EditProductPage() {
  const router = useRouter();
  const { id } = useParams();
  const { translate } = useLanguage();
  const { user, loading, piReady } = useAuth();

  const [role, setRole] = useState<string>("");
  const [product, setProduct] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadingPage, setLoadingPage] = useState(true);

  const [message, setMessage] = useState({
    text: "",
    type: "",
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  /* ============================================
     🔐 1) KIỂM TRA LOGIN + ROLE SELLER
  ============================================ */
  useEffect(() => {
    if (!loading && piReady) {
      if (!user) {
        router.push("/pilogin");
        return;
      }

      // Lấy role từ server
      fetch(`/api/users/role?username=${user.username}`)
        .then((res) => res.json())
        .then((data) => {
          setRole(data.role);
          if (data.role !== "seller") router.push("/no-access");
        })
        .catch(() => router.push("/pilogin"));
    }
  }, [loading, piReady, user, router]);

  /* ============================================
     📦 2) TẢI DANH MỤC
  ============================================ */
  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d));
  }, []);

  /* ============================================
     📌 3) LẤY THÔNG TIN SẢN PHẨM
  ============================================ */
  useEffect(() => {
    if (!id || !user) return;

    fetch("/api/products", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        const found = data.find((p: any) => String(p.id) === String(id));

        if (!found) {
          setMessage({ text: "Không tìm thấy sản phẩm!", type: "error" });
          return;
        }

        // ⭐ Kiểm tra đúng người bán
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
  }, [id, user, router]);

  /* ============================================
     📤 Upload file
  ============================================ */
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

  /* ============================================
     📸 Chọn file
  ============================================ */
  const handleFileChange = (e: any) => {
    const files = Array.from(e.target.files);
    setImages((p) => [...p, ...files]);
    setPreviews((p) => [...p, ...files.map((f) => URL.createObjectURL(f))]);
  };

  const removeImage = (i: number) => {
    setImages((p) => p.filter((_, x) => x !== i));
    setPreviews((p) => p.filter((_, x) => x !== i));
    setProduct((prev: any) => ({
      ...prev,
      images: prev?.images?.filter((_: any, idx: number) => idx !== i),
    }));
  };

  /* ============================================
     💾 4) Lưu sản phẩm
  ============================================ */
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
        seller: user.username, // ⭐ kiểm tra lại seller
      }),
    });

    const result = await res.json();

    if (result.success) {
      setMessage({ text: "Lưu thành công!", type: "success" });
      setTimeout(() => router.push("/seller/stock"), 1000);
    } else {
      setMessage({ text: result.message || "Lỗi lưu sản phẩm!", type: "error" });
    }

    setSaving(false);
  }

  /* ============================================
     📌 Loading UI
  ============================================ */
  if (loading || !piReady || !user || role !== "seller" || loadingPage)
    return <p className="text-center mt-10">⏳ Đang tải...</p>;

  if (!product)
    return <p className="text-center mt-10 text-red-500">Không tìm thấy sản phẩm!</p>;

  /* ============================================
     🎨 UI
  ============================================ */
  return (
    <main className="max-w-lg mx-auto p-6 bg-white rounded-xl shadow mt-10 pb-10">
      <h1 className="text-2xl font-bold text-center text-[#ff6600] mb-3">✏️ Chỉnh sửa sản phẩm</h1>

      {message.text && (
        <p className={`text-center mb-2 ${message.type === "success" ? "text-green-600" : "text-red-500"}`}>
          {message.text}
        </p>
      )}

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label>Tên</label>
          <input name="name" defaultValue={product.name} className="w-full border p-2 rounded" />
        </div>

        <div>
          <label>Giá</label>
          <input name="price" type="number" defaultValue={product.price} className="w-full border p-2 rounded" />
        </div>

        <div>
          <label>Danh mục</label>
          <select name="categoryId" defaultValue={product.categoryId} className="w-full border p-2 rounded">
            <option value="">— Chọn —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label>Mô tả</label>
          <textarea name="description" defaultValue={product.description} className="w-full border p-2 rounded" />
        </div>

        <div>
          <label>Ảnh</label>
          <input type="file" multiple onChange={handleFileChange} ref={fileInputRef} />

          <div className="mt-3 space-y-2">
            {previews.map((url, i) => (
              <div key={i} className="flex justify-between p-2 bg-gray-100 rounded">
                <img src={url} className="w-16 h-16 object-cover rounded" />
                <button type="button" onClick={() => removeImage(i)} className="text-red-600 font-bold">✕</button>
              </div>
            ))}
          </div>
        </div>

        <button disabled={saving} className="w-full bg-[#ff6600] text-white p-3 rounded">
          {saving ? "Đang lưu..." : "💾 Lưu thay đổi"}
        </button>
      </form>
    </main>
  );
}
