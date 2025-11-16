"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "@/context/AuthContext";

export default function SellerPostPage() {
  const { translate } = useLanguage();
  const { user, piReady, loading } = useAuth();
  const router = useRouter();

  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" | "" }>({
    text: "",
    type: "",
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [selectedPreview, setSelectedPreview] = useState<string | null>(null);

  // ⭐ THÊM DÒNG QUAN TRỌNG (Sửa 1)
  const [role, setRole] = useState<string | null>(null);

  // ⭐ LOAD CATEGORY
  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/categories");
      const data = await res.json();
      setCategories(data || []);
    };
    load();
  }, []);

  // ⭐ KIỂM TRA LOGIN
  useEffect(() => {
    if (!loading && piReady && !user) {
      router.push("/pilogin");
    }
  }, [loading, piReady, user, router]);

  // ⭐ KIỂM TRA QUYỀN SELLER
  useEffect(() => {
    if (user) {
      fetch(`/api/users/role?username=${user.username}`)
        .then(res => res.json())
        .then(data => {
          if (data.role !== "seller") {
            router.push("/no-access");
          } else {
            setRole("seller");
          }
        });
    }
  }, [user]);

  // ⭐ KIỂM TRA LOADING + ROLE (Sửa 2 — đặt đúng vị trí)
  if (loading || !piReady || !user || role !== "seller") {
    return <main className="text-center py-10">⏳ Đang tải...</main>;
  }

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

    const categoryId = parseInt((form.category as any).value);

    const salePrice = parseFloat((form.salePrice as any).value) || null;
    const saleStart = (form.saleStart as any).value || null;
    const saleEnd = (form.saleEnd as any).value || null;

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
      body: JSON.stringify({
        name,
        price,
        description: desc,
        images: urls,
        seller: user.username,
        categoryId,
        salePrice,
        saleStart,
        saleEnd,
      }),
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

  return (
    <main className="p-5 max-w-lg mx-auto pb-32">
      <h1 className="text-xl font-bold mb-3">🛒 Đăng sản phẩm mới</h1>
      <p className="text-gray-500 text-center mb-3">👤 Người bán: <b>{user.username}</b></p>

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
        {/* Form content giữ nguyên */}
        {/* (không thay đổi gì ở phần còn lại) */}
      </form>
    </main>
  );
}
