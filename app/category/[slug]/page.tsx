"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { type PageProps } from "next";

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

export default function CategoryPage({ params }: PageProps) {

  const { slug } = params as { slug: string };

  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;

    async function loadData() {
      try {
        const resCate = await fetch("/api/categories");
        const categories: Category[] = await resCate.json();

        const cate = categories.find(c => String(c.id) === String(slug));
        setCategory(cate ?? null);

        const resProducts = await fetch("/api/products", {
          cache: "no-store",
        });

        const allProducts: Product[] = await resProducts.json();

        const filtered = allProducts
          .filter(p => String(p.categoryId) === String(cate?.id))
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() -
              new Date(a.createdAt).getTime()
          );

        setProducts(filtered);

      } catch (err) {
        console.error("❌ Lỗi tải danh mục:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [slug]);

  return (
    <main className="p-4 max-w-6xl mx-auto">

      <Link href="/categories" className="text-orange-600 font-bold mb-4">
        ←
      </Link>

      <h1 className="text-2xl font-bold text-orange-600 mb-4">
        {category?.name ?? "Danh mục"}
      </h1>

      {loading ? (
        <p>Đang tải...</p>
      ) : products.length === 0 ? (
        <p className="text-gray-500">Hiện chưa có sản phẩm.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {products.map(p => (
            <Link key={p.id} href={`/product/${p.id}`} className="border rounded p-2">
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
