"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function CategoryDetailPage({ params }: any) {
  const { slug } = params; // slug = categoryId
  const categoryId = Number(slug);

  const [products, setProducts] = useState<any[]>([]);
  const [category, setCategory] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // ⭐ Lấy toàn bộ sản phẩm
        const resProducts = await fetch("/api/products", { cache: "no-store" });
        const allProducts = await resProducts.json();

        // ⭐ Lọc theo categoryId
        const filtered = allProducts.filter(
          (p: any) => p.categoryId === categoryId
        );
        setProducts(filtered);

        // ⭐ Lấy thông tin danh mục
        const resCate = await fetch("/api/categories");
        const categories = await resCate.json();
        const findCate = categories.find((c: any) => c.id === categoryId);
        setCategory(findCate || null);

      } catch (err) {
        console.error("❌ Lỗi tải danh mục:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [categoryId]);

  return (
    <main className="p-4 max-w-6xl mx-auto">

      {/* Back */}
      <Link href="/categories" className="text-orange-600 font-bold text-lg">
        ← Quay lại
      </Link>

      {/* Tên danh mục */}
      <h1 className="text-2xl font-bold my-4 text-orange-600">
        {category ? category.name : `Danh mục ${slug}`}
      </h1>

      {/* Loading */}
      {loading ? (
        <p>Đang tải...</p>
      ) : products.length === 0 ? (
        <p className="text-gray-500">Hiện chưa có sản phẩm trong danh mục này.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {products.map((p) => (
            <Link
              key={p.id}
              href={`/product/${p.id}`}
              className="border p-2 rounded-md shadow-sm"
            >
              <img
                src={p.images?.[0] || "/placeholder.png"}
                alt={p.name}
                className="w-full h-32 object-cover rounded"
              />

              <h3 className="font-bold text-sm mt-2">{p.name}</h3>

              <p className="text-orange-600 font-semibold text-sm">
                {p.finalPrice?.toLocaleString()} Pi
              </p>

              {p.isSale && (
                <p className="text-xs line-through text-gray-400">
                  {p.price?.toLocaleString()} Pi
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
