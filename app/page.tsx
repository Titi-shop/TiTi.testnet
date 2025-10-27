"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .catch((e) => console.error("❌ Lỗi tải sản phẩm:", e))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-center mt-10">⏳ Đang tải sản phẩm...</p>;

  return (
    <main className="bg-gray-50 min-h-screen pb-20">
      <h1 className="text-xl font-bold text-center mt-6 mb-4">🛍 Sản phẩm</h1>
      {products.length === 0 ? (
        <p className="text-center text-gray-500">Chưa có sản phẩm nào.</p>
      ) : (
        <div className="grid gap-4 px-3 sm:px-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
          {products.map((p: any) => (
            <div
              key={p.id}
              onClick={() => router.push(`/product/${p.id}`)}
              className="bg-white rounded-xl shadow hover:shadow-lg transition-all cursor-pointer border border-gray-100 p-3"
            >
              {p.images?.[0] ? (
                <img src={p.images[0]} alt={p.name} className="w-full aspect-square object-cover rounded-lg mb-2" />
              ) : (
                <div className="w-full aspect-square bg-gray-100 flex items-center justify-center rounded-lg mb-2 text-gray-400">
                  Không có ảnh
                </div>
              )}
              <h2 className="font-semibold text-sm text-gray-800 line-clamp-2">{p.name}</h2>
              <p className="text-orange-600 font-bold text-sm mt-1">{p.price} Pi</p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
