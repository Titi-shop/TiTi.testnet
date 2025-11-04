"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "../../context/LanguageContext";

export default function SellerPostPage() {
  const { translate } = useLanguage();
  const router = useRouter();
  const [sellerUser, setSellerUser] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" | "" }>({
    text: "",
    type: "",
  });
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // ✅ Xác thực người dùng Pi
  useEffect(() => {
    try {
      const stored = localStorage.getItem("pi_user");
      const logged = localStorage.getItem("titi_is_logged_in");
      if (!stored || logged !== "true") {
        router.push("/pilogin");
        return;
      }
      const parsed = JSON.parse(stored);
      const username =
        (parsed?.user?.username || parsed?.username || "").trim().toLowerCase();
      setSellerUser(username);
    } catch (err) {
      console.error("❌ Lỗi xác thực Pi:", err);
      router.push("/pilogin");
    }
  }, [router]);

  // ✅ Upload ảnh
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
      if (data.url) return data.url;
      throw new Error("Upload thất bại");
    } catch (err) {
      console.error("❌ Upload lỗi:", err);
      setMessage({ text: "Không thể tải ảnh lên.", type: "error" });
      return null;
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImagePreview(url);
  };

  // ✅ Đăng sản phẩm
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: "", type: "" });

    const form = e.currentTarget;
    let rawPrice = (form.price as any).value;
    rawPrice = rawPrice.replace(",", ".");
    const price = parseFloat(rawPrice);
    const name = (form.name as any).value.trim();
    const description = (form.description as any).value.trim();

    if (isNaN(price) || price <= 0) {
      setMessage({
        text: "⚠️ Vui lòng nhập giá hợp lệ (số dương, có thể nhỏ hơn 1).",
        type: "error",
      });
      setSaving(false);
      return;
    }

    if (!fileInputRef.current?.files?.length) {
      setMessage({ text: "Vui lòng chọn ảnh!", type: "error" });
      setSaving(false);
      return;
    }

    const file = fileInputRef.current.files[0];
    const uploadedUrl = await handleFileUpload(file);
    if (!uploadedUrl) {
      setSaving(false);
      return;
    }

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          price,
          description,
          images: [uploadedUrl],
          seller: sellerUser,
        }),
      });

      const result = await res.json();
      if (result.success) {
        setMessage({ text: "✅ Đăng sản phẩm thành công!", type: "success" });
        setTimeout(() => router.push("/seller/stock"), 1500);
      } else {
        setMessage({
          text: result.message || "❌ Đăng sản phẩm thất bại!",
          type: "error",
        });
      }
    } catch (err) {
      console.error("❌ POST Error:", err);
      setMessage({ text: "Lỗi khi đăng sản phẩm.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="max-w-lg mx-auto p-6 pb-32 bg-white shadow rounded-lg mt-8">
      <h1 className="text-2xl font-bold text-center mb-4">
        🛒 {translate("post_product") || "Đăng sản phẩm mới"}
      </h1>

      <p className="text-center text-gray-500 mb-3">
        👤 Người bán: <b>{sellerUser}</b>
      </p>

      {message.text && (
        <p
          className={`text-center font-medium mb-2 ${
            message.type === "success" ? "text-green-600" : "text-red-500"
          }`}
        >
          {message.text}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium mb-1">Tên sản phẩm</label>
          <input
            name="name"
            type="text"
            required
            className="w-full border rounded-md p-2"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Giá (Pi)</label>
          <input
            name="price"
            type="number"
            step="any"
            min="0.000001"
            required
            placeholder="VD: 0.2 hoặc 0.0005"
            className="w-full border rounded-md p-2"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Mô tả sản phẩm</label>
          <textarea
            name="description"
            rows={3}
            className="w-full border rounded-md p-2"
          ></textarea>
        </div>

        <div>
          <label className="block font-medium mb-1">Ảnh sản phẩm</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full"
          />
          {imagePreview && (
            <img
              src={imagePreview}
              alt="preview"
              className="w-full h-48 object-cover mt-2 rounded-md"
            />
          )}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-3 rounded-lg font-semibold"
        >
          {saving ? "⏳ Đang đăng..." : "📦 Đăng sản phẩm"}
        </button>
      </form>
    </main>
  );
}
