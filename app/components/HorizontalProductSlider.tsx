"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function HorizontalProductSlider({
  title,
  api
}: {
  title: string;
  api: string;
}) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch(api);
        const data = await res.json();
        setItems(data);
      } catch (err) {
        console.log("❌ Lỗi tải slider:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [api]);

  return (
    <div className="mt-5">
      {/* TITLE */}
      <h3 className="text-lg font-semibold mb-2 text-gray-800">
        {title}
      </h3>

      {/* SCROLL WRAPPER */}
      <div className="flex overflow-x-auto space-x-4 pb-3 scrollbar-hide">

        {loading ? (
          <p className="text-gray-500">Đang tải...</p>
        ) : items.length === 0 ? (
          <p className="text-gray-500">Không có sản phẩm nào.</p>
        ) : (
          items.map((p) => (
            <Link
              key={p.id}
              href={`/product/${p.id}`}
              className="min-w-[150px] bg-white rounded-xl border shadow p-2"
            >
              <img
                src={p.images?.[0] || "/placeholder.png"}
                className="w-full h-24 object-cover rounded-md"
              />
              <h4 className="text-sm font-medium mt-1 line-clamp-2">
                {p.name}
              </h4>
              <p className="text-orange-600 font-bold text-sm">
                {p.price} Pi
              </p>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
