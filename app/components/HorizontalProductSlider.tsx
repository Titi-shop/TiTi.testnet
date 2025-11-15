"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function HorizontalProductSlider({ title, type }) {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/products", { cache: "no-store" });
      const allProducts = await res.json();

      let filtered = [...allProducts];

      if (type === "highest") {
        filtered = filtered.sort((a, b) => b.price - a.price).slice(0, 20);
      }

      if (type === "newest") {
        filtered = filtered
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 20);
      }

      if (type === "sale") {
        const saleRes = await fetch("/api/sale");
        const sale = await saleRes.json();

        filtered = filtered.filter((p) => {
          const s = sale.find((x) => x.productId === p.id);
          return !!s;
        });
      }

      setProducts(filtered);
    }

    load();
  }, [type]);

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-3">{title}</h2>

      <div className="flex overflow-x-auto space-x-4 scrollbar-hide">
        {products.map((item) => (
          <Link
            key={item.id}
            href={`/product/${item.id}`}
            className="min-w-[150px] bg-white rounded-lg shadow p-2 border cursor-pointer"
          >
            <img
              src={item.images?.[0] || "/placeholder.png"}
              className="w-full h-24 object-cover rounded"
            />

            <h3 className="mt-2 text-sm font-semibold truncate">
              {item.name}
            </h3>

            <p className="text-orange-600 font-bold mt-1">{item.price}π</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
