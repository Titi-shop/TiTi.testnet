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
  const [message, setMessage] = useState("");
  const [sellerUser, setSellerUser] = useState<string>("");
  const [role, setRole] = useState<string>("buyer");

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

        if (!username) {
          router.push("/pilogin");
          return;
        }

        setSellerUser(username);

        const res = await fetch(`/api/users/role?username=${username}`);
        const data = await res.json();
        setRole(data.role || "buyer");

        if (data.role !== "seller") {
          alert("🚫 Bạn không có quyền truy cập khu vực kho hàng!");
          router.push("/customer");
        } else {
          await fetchProducts(username);
        }
      } catch (err) {
        console.error("❌ Lỗi xác thực:", err);
        router.push("/pilogin");
      }
    }

    loadUser();
  }, [router]);

  const fetchProducts = async (username: string) => {
    try {
      const res = await fetch("/api/products", { cache: "no-store" });
      const data = await res.json();

      const filtered = data.filter(
        (p: any) =>
          (p.seller || "").trim().toLowerCase() ===
          (username || "").trim().toLowerCase()
      );

      setProducts(filtered);
    } catch (err) {
      console.error("❌ Lỗi tải sản phẩm:", err);
      setMessage("Không thể tải sản phẩm.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    const confirmDelete = window.confirm("Bạn có chắc muốn xóa sản phẩm này?");
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/products?id=${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seller: sellerUser }),
      });
      const result = await res.json();

      if (result.success) {
        setMessage("✅ Đã xóa sản phẩm!");
        await fetchProducts(sellerUser);
      } else {
        setMessage(result.message || "Không thể xóa sản phẩm.");
      }
    } catch (err) {
      console.error("❌ DELETE Error:", err);
      setMessage("Lỗi khi xóa sản phẩm.");
    }
  };

  if (loading)
    return (
      <main className="p-6 text-center">
        <p>⏳ Đang tải dữ liệu...</p>
      </main>
    );

  if (role !== "seller")
    return (
      <main className="p-6 text-center">
        <h2>🔒 Bạn không có quyền truy cập khu vực này.</h2>
      </main>
    );

  return (
    <main className="p-4 max-w-3xl mx-auto pb-24">
      <h1 className="text-2xl font-bold text-center mb-4">📦 Quản lý kho hàng</h1>
      <p className="text-center text-sm text-gray-500 mb-3">
        👤 Người bán: <b>{sellerUser}</b>
      </p>

      {message && <p className="text-center mb-3 text-orange-600">{message}</p>}

      {products.length === 0 ? (
        <p className="text-center text-gray-500">Không có sản phẩm nào.</p>
      ) : (
        <div className="grid gap-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white shadow-md rounded-lg p-4 border border-gray-200"
            >
              {product.images?.[0] ? (
                <Image
                  src={product.images[0]}
                  alt={product.name}
                  width={400}
                  height={300}
                  className="w-full h-48 object-cover rounded-md mb-3"
                />
              ) : (
                <div className="w-full h-48 bg-gray-100 flex items-center justify-center text-gray-400 rounded-md mb-3">
                  Không có ảnh
                </div>
              )}
              <h2 className="text-lg font-semibold text-gray-800">
                {product.name}
              </h2>
              <p className="text-orange-600 font-bold mt-1">
                💰 {product.price} Pi
              </p>
              {product.description && (
                <p className="text-gray-500 mt-1">{product.description}</p>
              )}

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => router.push(`/seller/edit/${product.id}`)}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-md"
                >
                  ✏️ Sửa
                </button>
                <button
                  onClick={() => handleDelete(product.id)}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-md"
                >
                  ❌ Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
