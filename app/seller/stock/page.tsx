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
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" | "" }>({
    text: "",
    type: "",
  });
  const [sellerUser, setSellerUser] = useState<string>("");
  const [role, setRole] = useState<string>("buyer");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // ✅ Xác thực người dùng
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
          (parsed?.user?.username || parsed?.username || "").trim().toLowerCase();

        if (!username) {
          router.push("/pilogin");
          return;
        }

        setSellerUser(username);

        const res = await fetch(`/api/users/role?username=${username}`);
        const data = await res.json();
        setRole(data.role || "buyer");

        if (data.role !== "seller") {
          setMessage({ text: "🚫 Bạn không có quyền truy cập khu vực kho hàng!", type: "error" });
          setTimeout(() => router.push("/customer"), 2000);
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

  // ✅ Tải danh sách sản phẩm
  const fetchProducts = async (username: string) => {
    try {
      const res = await fetch("/api/products", { cache: "no-store" });
      const data = await res.json();
      const filtered = data.filter(
        (p: any) =>
          (p.seller || "").trim().toLowerCase() === (username || "").trim().toLowerCase()
      );
      setProducts(filtered);
    } catch (err) {
      console.error("❌ Lỗi tải sản phẩm:", err);
      setMessage({ text: "Không thể tải sản phẩm.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  // ✅ Xử lý xóa sản phẩm
  const handleDelete = async (id: number) => {
    setMessage({ text: "", type: "" });
    const product = products.find((p) => p.id === id);
    if (!product) return;

    const confirmed = confirm(`Bạn có chắc muốn xóa "${product.name}" không?`);
    if (!confirmed) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/products?id=${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seller: sellerUser }),
      });
      const result = await res.json();

      if (result.success) {
        setMessage({ text: "✅ Đã xóa sản phẩm!", type: "success" });
        await fetchProducts(sellerUser);
      } else {
        setMessage({
          text: result.message || "❌ Không thể xóa sản phẩm.",
          type: "error",
        });
      }
    } catch (err) {
      console.error("❌ DELETE Error:", err);
      setMessage({ text: "Lỗi khi xóa sản phẩm.", type: "error" });
    } finally {
      setDeletingId(null);
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
    <main className="p-4 max-w-5xl mx-auto pb-24">
      <h1 className="text-2xl font-bold text-center mb-4 text-[#ff6600]">
        🏪 Cửa hàng của tôi
      </h1>
      <p className="text-center text-sm text-gray-500 mb-4">
        👤 Người bán: <b>{sellerUser}</b>
      </p>

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
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300"
            >
              <div className="relative w-full h-44">
                {product.images?.[0] ? (
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                    Không có ảnh
                  </div>
                )}
              </div>

              <div className="p-3 text-center">
                <h3 className="font-semibold text-gray-800 truncate">
                  {product.name}
                </h3>
                <p className="text-[#ff6600] font-bold mt-1 text-sm">
                  {product.price} π
                </p>

                <div className="flex justify-center gap-6 mt-3 text-gray-700 text-xl relative z-50">
                  <button
                    onClick={() => router.push(`/product/${product.id}`)}
                    title="Xem"
                    className="hover:text-blue-500"
                  >
                    👁
                  </button>
                  <button
                    onClick={() => router.push(`/seller/edit/${product.id}`)}
                    title="Sửa"
                    className="hover:text-green-500"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    disabled={deletingId === product.id}
                    title="Xóa"
                    className={`hover:text-red-500 ${
                      deletingId === product.id ? "opacity-50" : ""
                    }`}
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
