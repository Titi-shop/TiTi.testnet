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
}

export default function SellerStockPage() {
  const { translate } = useLanguage();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // 🧾 Lấy danh sách sản phẩm
  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products", { cache: "no-store" });
      if (!res.ok) throw new Error("Fetch failed");
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("❌ Lỗi tải sản phẩm:", err);
      setMessage(translate("load_error") || "Không thể tải sản phẩm.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // ❌ Xoá sản phẩm
  const handleDelete = async (id: number) => {
    const confirmDelete = window.confirm(
      translate("confirm_delete") || "Bạn có chắc muốn xóa sản phẩm này?"
    );
    if (!confirmDelete) return;

    try {
      setRefreshing(true);
      const res = await fetch(`/api/products?id=${id}`, { method: "DELETE" });
      const result = await res.json();

      if (result.success) {
        setMessage(translate("delete_success") || "Đã xóa sản phẩm.");
        await fetchProducts();
      } else {
        setMessage(result.message || "Không thể xóa sản phẩm.");
      }
    } catch (err) {
      console.error("❌ DELETE Error:", err);
      setMessage(translate("delete_error") || "Lỗi khi xóa sản phẩm.");
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <main className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-center mb-4">
        📦 {translate("stock_manager_title") || "Quản lý kho hàng"}
      </h1>

      {message && (
        <p
          className={`text-center mb-3 font-medium ${
            message.includes("xóa") || message.includes("Lỗi")
              ? "text-red-600"
              : "text-green-600"
          }`}
        >
          {message}
        </p>
      )}

      {loading ? (
        <p className="text-center text-gray-500">
          {translate("loading_products") || "Đang tải sản phẩm..."}
        </p>
      ) : products.length === 0 ? (
        <p className="text-center text-gray-500">
          {translate("no_products") || "Không có sản phẩm nào."}
        </p>
      ) : (
        <div className="grid gap-4">
          {products.map((product) => {
            const img = product.images?.[0] || "";

            return (
              <div
                key={product.id}
                className="bg-white shadow-md rounded-lg p-4 border border-gray-200"
              >
                {img ? (
                  <Image
                    src={img}
                    alt={product.name}
                    width={400}
                    height={300}
                    className="w-full h-48 object-cover rounded-md mb-3"
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-100 flex items-center justify-center text-gray-400 rounded-md mb-3">
                    {translate("no_image") || "Không có ảnh"}
                  </div>
                )}

                <h2 className="text-lg font-semibold text-gray-800">{product.name}</h2>
                <p className="text-orange-600 font-bold mt-1">
                  💰 {product.price} Pi
                </p>
                {product.description && (
                  <p className="text-gray-500 mt-1">{product.description}</p>
                )}

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => router.push(`/seller/edit/${product.id}`)}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-md font-medium transition"
                  >
                    ✏️ {translate("edit") || "Sửa"}
                  </button>

                  <button
                    onClick={() => handleDelete(product.id)}
                    disabled={refreshing}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-md font-medium transition"
                  >
                    {refreshing ? "⏳ Đang xóa..." : "❌ " + (translate("delete") || "Xóa")}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
