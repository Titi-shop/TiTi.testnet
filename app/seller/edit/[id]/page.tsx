"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLanguage } from "../../context/LanguageContext";

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
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string>("buyer");
  const [sellerUser, setSellerUser] = useState<string>("");
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error" | "";
  }>({ text: "", type: "" });

  const [deletingId, setDeletingId] = useState<number | null>(null);

  // ============================================
  // 🔐 Xác thực người bán
  // ============================================
  useEffect(() => {
    async function loadUser() {
      try {
        const stored = localStorage.getItem("pi_user");
        const logged = localStorage.getItem("titi_is_logged_in");

        if (!stored || logged !== "true") {
          router.push("/pilogin");
          return;
        }

        const parsed = JSON.parse(stored);
        const username =
          (parsed?.user?.username || parsed?.username || "")
            .trim()
            .toLowerCase();

        if (!username) return router.push("/pilogin");

        setSellerUser(username);

        // check role
        const res = await fetch(`/api/users/role?username=${username}`);
        const data = await res.json();

        setRole(data.role);

        if (data.role !== "seller") {
          setMessage({
            text: "🚫 Bạn không có quyền truy cập khu vực kho hàng!",
            type: "error",
          });
          setTimeout(() => router.push("/customer"), 2000);
          return;
        }

        await fetchProducts(username);
      } catch (err) {
        console.error("❌ Lỗi xác thực:", err);
        router.push("/pilogin");
      }
    }

    loadUser();
  }, []);

  // ============================================
  // 📦 Lấy sản phẩm theo seller
  // ============================================
  const fetchProducts = async (username: string) => {
    try {
      const res = await fetch("/api/products", { cache: "no-store" });
      const data = await res.json();

      const filtered = data.filter(
        (p: any) =>
          p.seller?.trim().toLowerCase() === username.trim().toLowerCase()
      );

      setProducts(filtered);
    } catch (err) {
      console.error("❌ Lỗi tải sản phẩm:", err);
      setMessage({ text: "Không thể tải sản phẩm!", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // ❌ Xóa sản phẩm
  // ============================================
  const handleDelete = async (id: number) => {
    const product = products.find((p) => p.id === id);
    if (!product) return;

    if (!confirm(`Bạn chắc muốn xóa "${product.name}"?`)) return;

    setDeletingId(id);

    try {
      const res = await fetch(`/api/products?id=${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seller: sellerUser }),
      });

      const result = await res.json();

      if (result.success) {
        setMessage({ text: "🗑 Xóa thành công!", type: "success" });
        fetchProducts(sellerUser);
      } else {
        setMessage({ text: result.message, type: "error" });
      }
    } catch (err) {
      console.error("❌ DELETE error:", err);
      setMessage({ text: "Không thể xóa!", type: "error" });
    } finally {
      setDeletingId(null);
    }
  };

  // ============================================
  // 📌 Loading
  // ============================================
  if (loading)
    return (
      <main className="p-6 text-center">
        <p>⏳ Đang tải...</p>
      </main>
    );

  if (role !== "seller")
    return (
      <main className="p-6 text-center">
        <h2>🔒 Bạn không có quyền truy cập.</h2>
      </main>
    );

  // ============================================
  // ⭐ Giao diện chính
  // ============================================
  return (
    <main className="p-4 max-w-5xl mx-auto pb-24">
      <h1 className="text-2xl font-bold text-center mb-2 text-[#ff6600]">
        🏪 Kho hàng của tôi
      </h1>
      <p className="text-center text-gray-500 mb-4">
        👤 Người bán: <b>{sellerUser}</b>
      </p>

      {message.text && (
        <p
          className={`text-center mb-3 ${
            message.type === "success"
              ? "text-green-600"
              : "text-red-600 font-medium"
          }`}
        >
          {message.text}
        </p>
      )}

      {/* Không có SP */}
      {products.length === 0 ? (
        <p className="text-center text-gray-400">Bạn chưa có sản phẩm nào.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-lg shadow border hover:shadow-md transition"
            >
              {/* Ảnh sản phẩm → click xem */}
              <div
                className="relative w-full h-32 rounded-md overflow-hidden cursor-pointer"
                onClick={() => router.push(`/product/${product.id}`)}
              >
                {product.images?.[0] ? (
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                    No Image
                  </div>
                )}
              </div>

              {/* Tên + Giá */}
              <div className="mt-2 text-center p-2">
                <h3 className="text-sm font-semibold truncate">
                  {product.name}
                </h3>
                <p className="text-[#ff6600] font-bold text-sm">
                  {product.price} π
                </p>
              </div>

              {/* Nút sửa/xóa */}
              <div className="flex justify-center gap-6 py-2 border-t">
                {/* Sửa */}
                <button
                  onClick={() => router.push(`/seller/edit/${product.id}`)}
                  className="text-green-600 text-lg hover:scale-110 transition"
                  title="Sửa"
                >
                  ✏️
                </button>

                {/* Xóa */}
                <button
                  onClick={() => handleDelete(product.id)}
                  disabled={deletingId === product.id}
                  className={`text-red-600 text-lg hover:scale-110 transition ${
                    deletingId === product.id ? "opacity-40" : ""
                  }`}
                  title="Xóa"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
