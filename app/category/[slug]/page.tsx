"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/* =====================
   TYPES
===================== */
interface Product {
  id: string;
  name: string;
  price: number;
  finalPrice?: number;
  images?: string[];
  categoryId?: number;
  createdAt: string;
  isSale?: boolean;
}

interface Category {
  id: number | string;
  name: string;
  icon?: string;
}

interface PageProps {
  params: {
    slug: string;
  };
}
export default async function CategoryPage({ params }) {
  const slug = params.slug;


  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        /* ============================
           ⭐ LẤY TẤT CẢ SẢN PHẨM
        ============================ */
        const resProducts = await fetch("/api/products", {
          cache: "no-store",
        });
        const allProducts: Product[] = await resProducts.json();

        const filtered = allProducts
          .filter((p) => Number(p.categoryId) === categoryId)
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() -
              new Date(a.createdAt).getTime()
          );

        setProducts(filtered);

        /* ============================
           ⭐ LẤY THÔNG TIN DANH MỤC
        ============================ */
        const resCate = await fetch("/api/categories");
        const categories: Category[] = await resCate.json();

        const cate = categories.find(
          (c) => Number(c.id) === categoryId
        );

        setCategory(cate || null);
      } catch (err) {
        console.error("❌ Lỗi tải danh mục:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [categoryId]);

  return (
    <main className="p-4 max-w-6xl mx-auto">
      <Link
        href="/categories"
        className="text-orange-600 font-bold text-lg inline-block mb-4"
      >
        ←
      </Link>

      <h1 className="text-2xl font-bold mb-4 text-orange-600">
        {category ? category.name : "Danh mục"}
      </h1>

      {loading ? (
        <p>Đang tải...</p>
      ) : products.length === 0 ? (
        <p className="text-gray-500">Hiện chưa có sản phẩm.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {products.map((p) => (
            <Link
              key={p.id}
              href={`/product/${p.id}`}
              className="border p-2 rounded-md shadow-sm hover:shadow-md transition"
            >
              <img
                src={p.images?.[0] || "/placeholder.png"}
                alt={p.name}
                className="w-full h-32 object-cover rounded"
              />

              <h3 className="font-bold text-sm mt-2 truncate">
                {p.name}
              </h3>

              {p.isSale ? (
                <>
                  <p className="text-red-600 font-bold">
                    {p.finalPrice?.toLocaleString()} Pi
                  </p>
                  <p className="text-xs line-through text-gray-400">
                    {p.price.toLocaleString()} Pi
                  </p>
                </>
              ) : (
                <p className="text-orange-600 font-semibold">
                  {p.price.toLocaleString()} Pi
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
