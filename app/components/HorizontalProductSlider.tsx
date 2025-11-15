"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function HorizontalProductSlider({ title, type }) {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetch("/api/products", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        let filtered = [...data];

        switch (type) {
          case "highest": // 10 giá cao nhất
            filtered = filtered
              .sort((a, b) => Number(b.price) - Number(a.price))
              .slice(0, 10);
            break;

          case "newest": // 10 sản phẩm mới
            filtered = filtered
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
              .slice(0, 10);
            break;

          case "sale": // SP sale, tự lọc theo ngày
            filtered = filtered.filter(
              (p) =>
                p.salePrice &&
                p.saleStart &&
                p.saleEnd &&
                new Date() >= new Date(p.saleStart) &&
                new Date() <= new Date(p.saleEnd)
            );
            break;

          case "mostViewed": // Nhiều người xem nhất
            filtered = filtered
              .sort((a, b) => Number(b.views || 0) - Number(a.views || 0))
              .slice(0, 10);
            break;

          case "fashion":
            filtered = filtered.filter(
              (p) => Number(p.categoryId) === 2 || Number(p.categoryId) === 3
            );
            break;

          case "phone":
            filtered = filtered.filter((p) => Number(p.categoryId) === 1);
            break;

          case "laptop":
            filtered = filtered.filter((p) => Number(p.categoryId) === 7);
            break;

          case "electronic":
            filtered = filtered.filter((p) => Number(p.categoryId) === 8);
            break;

          default:
            break;
        }

        setProducts(filtered);
      });
  }, [type]);

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-3">{title}</h2>

      <div className="flex overflow-x-auto space-x-4 scrollbar-hide">
        {products.map((item) => {
          const salePercent =
            item.salePrice && item.price
              ? Math.round(((item.price - item.salePrice) / item.price) * 100)
              : 0;

          return (
            <Link
              key={item.id}
              href={`/product/${item.id}`}
              className="relative min-w-[150px] bg-white rounded-lg shadow p-2 border cursor-pointer"
            >
              {/* Badge % SALE */}
              {salePercent > 0 && (
                <span className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full shadow">
                  -{salePercent}%
                </span>
              )}

              <img
                src={item.images?.[0] || "/placeholder.png"}
                alt={item.name}
                className="w-full h-24 object-cover rounded"
              />

              <h3 className="mt-2 text-sm font-semibold truncate">
                {item.name}
              </h3>

              {item.salePrice ? (
                <div className="mt-1">
                  <p className="text-red-600 font-bold">
                    {item.salePrice} π
                  </p>
                  <p className="text-xs line-through text-gray-400">
                    {item.price} π
                  </p>
                </div>
              ) : (
                <p className="text-orange-600 font-bold mt-1">
                  {item.price} π
                </p>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
