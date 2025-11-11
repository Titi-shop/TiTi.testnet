"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "@/context/AuthContext";

interface Product {
  id: number;
  name: string;
  price: number;
  description?: string;
  images?: string[];
  seller?: string;
}

export default function SellerStockPage() {
  const { translate } = useLanguage();
  const { user, piReady } = useAuth();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" | "" }>({
    text: "",
    type: "",
  });
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [role, setRole] = useState("buyer");

  // ✅ Kiểm tra quyền seller
  useEffect(() => {
    if (!piReady) return;
    if (!user) {
      router.push("/pilogin");
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch(`/api/users/role?username=${user.username}`);
        const data = await res.json();
        setRole(data.role || "buyer");
        if (data.role === "seller") {
          await fetchProducts(user.username);
        } else {
          setMessage({
            text: "🚫 Bạn không có quyền truy cập khu vực kho hàng!",
            type: "error",
          });
          setTimeout(() => router.push("/customer"), 2000);
        }
      } catch (err) {
        console.error("❌ Lỗi xác thực:", err);
        router.push("/pilogin");
      }
    };

    verify();
  }, [piReady, user, router]);

  // ✅ Lấy danh sách sản phẩm
  const fetchProducts = async (username: string) => {
    try {
      const res = await fetch("/api/products", { cache: "no-store" });
      const data = await res.json();
      const filtered = data.filter(
        (p: any) => (p.seller || "").trim().toLowerCase() === username.trim().toLowerCase()
      );
      setProducts(filtered);
    } catch (err) {
      console.error("❌ Lỗi tải sản phẩm:", err);
      setMessage({ text: "Không thể tải sản phẩm.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  // ✅ Xóa sản phẩm
  const handleDelete = async (id: number) => {
    const product = products.find((p) => p.id === id);
    if (!product) return;
    if (!confirm(`Bạn có chắc muốn xóa "${product.name}" không?`)) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/products?id=${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seller: user?.username }),
      });
      const result = await res.json();

      if (result.success) {
        setMessage({ text: "✅ Đã xóa sản phẩm!", type: "success" });
        await fetchProducts(user.username);
      } else {
        setMessage({
          text: result.message || "❌ Không thể xóa sản phẩm.",
          type: "error",
        });
      }
    } catch {
      setMessage({ text: "Lỗi khi xóa sản phẩm.", type: "error" });
    } finally {
      setDeletingId(null);
    }
  };

  if (!piReady || loading)
    return (
      <main className="flex items-center justify-center min-h-screen text-gray-500">
        ⏳ Đang tải dữ liệu...
      </main>
    );

  if (role !== "seller")
    return (
      <main className="text-center py-20 text-red-500 font-semibold">
        🔒 Bạn không có quyền truy cập khu vực này.
      </main>
    );

  return (
    <main className="p-5 max-w-6xl mx-auto">
      <h1 className="text-xl font-bold mb-3">🏪 {translate("my_store") || "Cửa hàng của tôi"}</h1>
      <p className="mb-3 text-gray-600">👤 Người bán: <b>{user?.username}</b></p>

      {message.text && (
        <p
          className={`text-center mb-3 font-medium ${
            message.type === "success" ? "text-green-600" : "text-red-500"
          }`}
        >
          {message.text}
        </p>
      )}

      {products.length === 0 ? (
        <p className="text-center text-gray-500">Không có sản phẩm nào.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {products.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-xl shadow border hover:shadow-lg transition overflow-hidden"
            >
              <div className="relative w-full h-44">
                {p.images?.[0] ? (
                  <Image src={p.images[0]} alt={p.name} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                    Không có ảnh
                  </div>
                )}
              </div>

              <div className="p-3 text-center">
                <h3 className="font-semibold text-gray-800 truncate">{p.name}</h3>
                <p className="text-[#ff6600] font-bold mt-1 text-sm">{p.price} π</p>
                <div className="flex justify-center gap-4 mt-2 text-gray-600 text-lg">
                  <button
                    onClick={() => router.push(`/product/${p.id}`)}
                    title="Xem"
                    className="hover:text-blue-500"
                  >
                    👁
                  </button>
                  <button
                    onClick={() => router.push(`/seller/edit/${p.id}`)}
                    title="Sửa"
                    className="hover:text-green-500"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    disabled={deletingId === p.id}
                    title="Xóa"
                    className={`hover:text-red-500 ${deletingId === p.id ? "opacity-50" : ""}`}
                  >
                    🗑
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
