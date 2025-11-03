"use client";

import { useState, ChangeEvent, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useLanguage } from "../../context/LanguageContext";

export default function SellerPostPage() {
  const router = useRouter();
  const { translate } = useLanguage();

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [sellerUser, setSellerUser] = useState<string>("");
  const [role, setRole] = useState<string>("buyer");
  const [loading, setLoading] = useState(true);

  // ✅ Lấy thông tin người dùng từ localStorage & xác thực quyền
  useEffect(() => {
    async function checkAccess() {
      try {
        const stored = localStorage.getItem("pi_user");
        const logged = localStorage.getItem("titi_is_logged_in");

        if (!stored || logged !== "true") {
          router.push("/pilogin");
          return;
        }

        const parsed = JSON.parse(stored);
        const username = (parsed?.user?.username || parsed?.username || "").trim().toLowerCase();

        if (!username) {
          router.push("/pilogin");
          return;
        }

        setSellerUser(username);

        const res = await fetch(`/api/users/role?username=${username}`);
        const data = await res.json();

        if (data.role === "seller") {
          setRole("seller");
        } else {
          alert("🚫 Bạn không có quyền đăng sản phẩm!");
          router.push("/customer");
        }
      } catch (err) {
        console.error("❌ Lỗi xác thực:", err);
        router.push("/pilogin");
      } finally {
        setLoading(false);
      }
    }

    checkAccess();
  }, [router]);

  if (loading) {
    return <main className="p-6 text-center">⏳ Đang xác thực...</main>;
  }

  if (role !== "seller") {
    return (
      <main className="p-6 text-center">
        🔒 Bạn không có quyền đăng sản phẩm.
      </main>
    );
  }

  // 🖼 Xử lý chọn ảnh
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const selected = Array.from(files).slice(0, 6);
    setImages(selected);
    setPreviewUrls(selected.map((f) => URL.createObjectURL(f)));
  };

  // ☁️ Upload ảnh lên API
  const uploadToBlob = async (file: File): Promise<string> => {
    const res = await fetch("/api/upload", {
      method: "POST",
      headers: {
        "Content-Type": file.type,
        "x-filename": file.name,
      },
      body: file,
    });
    if (!res.ok) throw new Error("Upload thất bại");
    const data = await res.json();
    return data.url;
  };

  // 🧾 Gửi dữ liệu sản phẩm
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name || !price) {
      alert("⚠️ Vui lòng nhập đủ tên và giá sản phẩm!");
      return;
    }

    try {
      setUploading(true);
      setMessage("📤 Đang tải ảnh lên...");

      const uploadedUrls = await Promise.all(images.map(uploadToBlob));

      setMessage("📦 Đang lưu sản phẩm...");

      const product = {
        name,
        price: Number(price),
        description,
        images: uploadedUrls,
        createdAt: new Date().toISOString(),
        seller: sellerUser,
      };

      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(product),
      });

      if (!res.ok) throw new Error("Lưu sản phẩm thất bại");

      setMessage("✅ Đăng sản phẩm thành công!");
      setTimeout(() => router.push("/seller/stock"), 1500);
    } catch (err) {
      console.error(err);
      setMessage("❌ Đăng sản phẩm thất bại!");
    } finally {
      setUploading(false);
    }
  };

  // ✅ Giao diện
  return (
    <main className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-center mb-4">🛒 Đăng sản phẩm mới</h1>
      <p className="text-center text-sm text-gray-600 mb-3">
        👤 Người bán: <b>{sellerUser}</b>
      </p>

      {message && <p className="text-center mb-3 text-orange-600">{message}</p>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 bg-white shadow p-4 rounded-lg">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tên sản phẩm"
          className="border p-2 rounded"
          required
        />
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Giá (Pi)"
          className="border p-2 rounded"
          required
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Mô tả sản phẩm"
          className="border p-2 rounded h-24"
        />
        <label className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded inline-block text-center">
          📁 Chọn ảnh
          <input type="file" multiple accept="image/*" onChange={handleImageChange} className="hidden" />
        </label>
        {previewUrls.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mt-3">
            {previewUrls.map((url, i) => (
              <Image key={i} src={url} alt={`Ảnh ${i + 1}`} width={120} height={120} className="object-cover rounded border" />
            ))}
          </div>
        )}
        <button type="submit" disabled={uploading} className="bg-yellow-500 hover:bg-yellow-600 text-white py-2 rounded mt-4">
          {uploading ? "⏳ Đang đăng..." : "📦 Đăng sản phẩm"}
        </button>
      </form>
    </main>
  );
}
