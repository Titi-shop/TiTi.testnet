"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function CategoryDetailPage() {
  const { id } = useParams();
  const [category, setCategory] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        // Lấy tất cả danh mục
        const catRes = await fetch("/api/categories");
        const cats = await catRes.json();
        const found = cats.find((c: any) => String(c.id) === String(id));
        setCategory(found || null);

        // Lấy sản phẩm
        const prodRes = await fetch("/api/products");
        const allProducts = await prodRes.json();

        const filtered = allProducts.filter((p: any) => Number(p.categoryId) === Number(id));
        setProducts(filtered);
      } catch (err) {
        console.log("Lỗi:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id]);

  if (loading)
    return <main className="text-center p-5">⏳ Đang tải...</main>;

  return (
    <main className="p-5">
      <button onClick={() => history.back()} className="mb-3 text-orange-600 font-bold">
        ← Quay lại
      </button>

      <h1 className="text-xl font-bold mb-4">
        {category?.name || "Danh mục"}
      </h1>

      {products.length === 0 ? (
        <p className="text-gray-500">Không có sản phẩm nào.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {products.map((p) => (
            <Link
              key={p.id}
              href={`/product/${p.id}`}
              className="bg-white rounded-lg shadow border p-2"
            >
              <img
                src={p.images?.[0] || "/placeholder.png"}
                className="w-full h-36 object-cover rounded"
              />
              <p className="mt-2 font-semibold truncate">{p.name}</p>

              {/* 👇 Tự động hiển thị giá sale khi đến ngày */}
              {p.salePrice && p.saleStart && p.saleEnd ? (
                <div>
                  <p className="text-red-600 font-bold">{p.salePrice} π</p>
                  <p className="line-through text-gray-400 text-sm">{p.price} π</p>
                </div>
              ) : (
                <p className="text-orange-600 font-bold">{p.price} π</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
