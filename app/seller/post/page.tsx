"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import "@/app/lib/i18n";
import { useAuth } from "@/context/AuthContext";

interface Category {
  id: number;
  name: string;
}

export default function SellerPostPage() {
  const router = useRouter();
  const { user, loading, piReady } = useAuth();

  const [role, setRole] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  useEffect(() => {
    if (!loading && piReady && user) {
      fetch(`/api/users/role?username=${user.username}`)
        .then((r) => r.json())
        .then((d) => {
          setRole(d.role);
          if (d.role !== "seller") router.push("/no-access");
        });
    }
  }, [loading, piReady, user]);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d: Category[]) => setCategories(d));
  }, []);

  if (loading || !piReady || !user) return <p>⏳ Đang tải...</p>;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    const form = e.currentTarget;
    const data = {
      name: form.name.value,
      price: Number(form.price.value),
      categoryId: Number(form.category.value),
      images: previews,
      seller: user.username,
    };

    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await res.json();
    if (result.success) router.push("/seller/stock");
    setSaving(false);
  }

  return (
    <main className="p-5 max-w-lg mx-auto pb-32">
      {/* UI giữ nguyên */}
      {/* ... */}
    </main>
  );
}
