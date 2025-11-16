"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function SellerStockPage() {
  const router = useRouter();
  const { user, loading, piReady } = useAuth();

  const [role, setRole] = useState<string>("");
  const [sellerUser, setSellerUser] = useState<string>("");
  const [products, setProducts] = useState<any[]>([]);
  const [pageLoading, setPageLoading] = useState(true);

  const [message, setMessage] = useState({
    text: "",
    type: "",
  });

  /* ============================================
     🔐 KIỂM TRA SELLER
  ============================================ */
  useEffect(() => {
    if (!loading && piReady) {
      if (!user) {
        router.push("/pilogin");
        return;
      }

      const username = user.username.trim().toLowerCase();
      setSellerUser(username);

      // Fetch role
      fetch(`/api/users/role?username=${username}`)
        .then((r) => r.json())
        .then((d) => {
          setRole(d.role);
          if (d.role !== "seller") {
            router.push("/no-access");
          } else {
            loadProducts(username);
          }
        });
    }
  }, [loading, piReady, user, router]);

  /* ============================================
     📦 Lấy sản phẩm theo seller
  ============================================ */
  async function loadProducts(username: string) {
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
      setPageLoading(false);
    }
  }

  /* ============================================
     ❌ Xóa sản phẩm
  ============================================ */
  const handleDelete = async (id: number) => {
    const product = products.find((p) => p.id === id);
    if (!product) return;

    if (!confirm(`Bạn có chắc muốn xóa "${product.name}"?`)) return;

    try {
      const res = await fetch(`/api/products?id=${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seller: sellerUser }),
      });

      const data = await res.json();

      if (data.success) {
        setMessage({ text: "🗑 Xóa thành công!", type: "success" });
        loadProducts(sellerUser);
      } else {
        setMessage({ text: data.message, type: "error" });
      }
    } catch {
      setMessage({ text: "Không thể xóa!", type: "error" });
    }
  };

  /* ============================================
     ⏳ LOADING
  ============================================ */
  if (loading || pageLoading || !piReady || !user || role !== "seller") {
    return <main className="text-center p-8">⏳ Đang tải...</main>;
  }

  return (
    <main className="p-4 max-w-2xl mx-auto pb-28">
      {/* Nút quay lại */}
      <button
        className="mb-4 text-blue-600 underline"
        onClick={() => router.push("/seller")}
      >
        ← Quay lại
      </button>

      <h1 className="text-2xl font-bold text-center mb-2 text-[#ff6600]">
        📦 Kho hàng của tôi
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

      {products.length === 0 ? (
        <p className="text-center text-gray-400">Bạn chưa đăng sản phẩm nào.</p>
      ) : (
        <div className="space-y-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="flex gap-3 p-3 bg-white rounded-lg shadow border"
            >
              {/* Ảnh */}
              <div className="w-24 h-24 relative rounded overflow-hidden">
                {product.images?.[0] ? (
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
                    No Img
                  </div>
                )}
              </div>

              {/* Thông tin */}
              <div className="flex-1">
                <h3 className="font-semibold truncate">{product.name}</h3>
                <p className="text-[#ff6600] font-bold">{product.price} π</p>

                <div className="flex gap-4 mt-2">
                  <button
                    onClick={() => router.push(`/seller/edit/${product.id}`)}
                    className="text-green-600 underline"
                  >
                    Sửa
                  </button>

                  <button
                    onClick={() => handleDelete(product.id)}
                    className="text-red-600 underline"
                  >
                    Xóa
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
