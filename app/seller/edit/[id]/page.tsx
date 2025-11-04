"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useLanguage } from "../../../context/LanguageContext";

export default function EditProductPage() {
  const { id } = useParams();
  const router = useRouter();
  const { translate } = useLanguage();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" | "" }>({
    text: "",
    type: "",
  });
  const [sellerUser, setSellerUser] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ✅ Lấy thông tin đăng nhập Pi
  useEffect(() => {
    try {
      const stored = localStorage.getItem("pi_user");
      const logged = localStorage.getItem("titi_is_logged_in");
      if (stored && logged === "true") {
        const parsed = JSON.parse(stored);
        const username = (parsed?.user?.username || parsed?.username || "")
          .trim()
          .toLowerCase();
        setSellerUser(username);
      } else {
        router.push("/pilogin");
      }
    } catch (err) {
      console.error("❌ Lỗi đọc Pi user:", err);
      router.push("/pilogin");
    }
  }, [router]);

  // 🧩 Tải thông tin sản phẩm
  useEffect(() => {
    if (!id) return;
    fetch("/api/products", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        const found = data.find((p: any) => String(p.id) === String(id));
        setProduct(found || null);
        setLoading(false);
      })
      .catch((err) => {
        console.error("❌ Lỗi tải sản phẩm:", err);
        setMessage({ text: "Không thể tải thông tin sản phẩm.", type: "error" });
        setLoading(false);
      });
  }, [id]);

  // ✅ Upload ảnh qua Blob API
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSaving(true);
    const url = await handleFileUpload(file);
    if (url) {
      setProduct((prev: any) => ({ ...prev, images: [url] }));
      setMessage({ text: "Ảnh đã được cập nhật.", type: "success" });
    } else {
      setMessage({ text: "Tải ảnh thất bại, vui lòng thử lại!", type: "error" });
    }
    setSaving(false);
  };

  // ✅ Lưu sản phẩm
  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: "", type: "" });

    const form = e.currentTarget;
    let rawPrice = (form.price as any).value;
    rawPrice = rawPrice.replace(",", ".");
    const price = parseFloat(rawPrice);
    const name = (form.name as any).value;
    const description = (form.description as any).value;

    if (isNaN(price) || price <= 0) {
      setMessage({
        text: "⚠️ Vui lòng nhập giá hợp lệ (số dương, có thể nhỏ hơn 1).",
        type: "error",
      });
      setSaving(false);
      return;
    }

    try {
      const res = await fetch("/api/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: product.id,
          name,
          price,
          description,
          images: product.images || [],
          seller: sellerUser,
        }),
      });

      const result = await res.json();
      if (result.success) {
        setMessage({ text: "✅ Cập nhật sản phẩm thành công!", type: "success" });
        setTimeout(() => router.push("/seller/stock"), 1500);
      } else {
        setMessage({
          text: result.message || "❌ Không thể cập nhật sản phẩm.",
          type: "error",
        });
      }
    } catch (err) {
      console.error("❌ PUT error:", err);
      setMessage({ text: "Không thể cập nhật sản phẩm.", type: "error" });
    } finally {
      setSaving(false);
    }
  }

  if (loading)
    return <p className="text-center mt-10 text-gray-600">⏳ Đang tải dữ liệu...</p>;

  if (!product)
    return <p className="text-center mt-10 text-red-500">Không tìm thấy sản phẩm!</p>;

  return (
    <main className="max-w-lg mx-auto p-6 bg-white rounded-xl shadow mt-10 pb-32">
      <h1 className="text-xl font-bold mb-4 text-center text-gray-800">
        ✏️ {translate("edit_product") || "Chỉnh sửa sản phẩm"}
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

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block font-medium mb-1">Tên sản phẩm</label>
          <input
            name="name"
            defaultValue={product.name}
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
            defaultValue={product.price}
            required
            inputMode="decimal"
            className="w-full border rounded-md p-2"
            placeholder="VD: 0.5 hoặc 0.0001"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Mô tả sản phẩm</label>
          <textarea
            name="description"
            defaultValue={product.description}
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
          {product.images?.[0] && (
            <img
              src={product.images[0]}
              alt="preview"
              className="w-full h-48 object-cover mt-2 rounded-md"
            />
          )}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-green-600 hover:bg-green-700 text-white p-3 rounded-lg font-semibold"
        >
          {saving ? "💾 Đang lưu..." : "✅ Lưu thay đổi"}
        </button>
      </form>
    </main>
  );
}
