"use client";

import Link from "next/link";

interface SliderProps {
  title?: string;
  products: any[];
}

export default function HorizontalProductSlider({ title, products }: SliderProps) {
  return (
    <div className="mt-4">
      {/* Tiêu đề */}
      {title && (
        <h3 className="text-lg font-semibold mb-2 text-gray-700">
          {title}
        </h3>
      )}

      {/* Thanh trượt sản phẩm ngang */}
      <div className="flex overflow-x-auto space-x-4 pb-3 scrollbar-hide">
        {products.map((p) => (
          <Link
            key={p.id}
            href={`/product/${p.id}`}
            className="min-w-[150px] bg-white rounded-xl border shadow p-2"
          >
            <img
              src={p.images?.[0] || "/placeholder.png"}
              className="w-full h-24 object-cover rounded-md"
              alt={p.name}
            />

            <h4 className="text-sm font-medium mt-1 line-clamp-2">
              {p.name}
            </h4>

            <p className="text-orange-600 font-bold text-sm">
              {p.price} Pi
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
