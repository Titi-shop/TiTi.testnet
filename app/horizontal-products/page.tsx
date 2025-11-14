"use client";

import { useEffect, useState } from "react";

export default function HorizontalProducts() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => setProducts(data));
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-3">🔥 Sản phẩm nổi bật</h2>

      <div className="flex space-x-4 overflow-x-auto scrollbar-hide">
        {products.map((item) => (
          <div
            key={item.id}
            className="min-w-[150px] bg-white rounded-lg shadow p-2 border"
          >
            <img
              src={item.image}
              alt={item.name}
              className="w-full h-24 object-cover rounded"
            />
            <h3 className="mt-2 text-sm font-semibold">{item.name}</h3>
            <p className="text-orange-600 font-bold">{item.price} Pi</p>
          </div>
        ))}
      </div>
    </div>
  );
}
