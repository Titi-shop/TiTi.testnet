"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft } from "lucide-react";

export default function ProductDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [product, setProduct] = useState<any>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showZoom, setShowZoom] = useState(false);

  // 🧩 Lấy dữ liệu sản phẩm từ API
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/products?id=${id}`, { cache: "no-store" });
        const data = await res.json();
        setProduct(Array.isArray(data) ? data[0] : data);
      } catch (err) {
        console.error("❌ Lỗi tải sản phẩm:", err);
      }
    };
    fetchProduct();
  }, [id]);

  // 🔄 Tự động đổi hình mỗi 5 giây
  useEffect(() => {
    if (!product?.images?.length) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % product.images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [product]);

  if (!product)
    return <p className="text-center mt-10 text-gray-500">Đang tải sản phẩm...</p>;

  return (
    <main className="bg-gray-50 min-h-screen">
      {/* ===== Thanh tiêu đề ===== */}
      <div className="flex items-center gap-3 bg-white shadow p-3 sticky top-0 z-20">
        <button onClick={() => router.back()}>
          <ChevronLeft className="w-6 h-6 text-gray-600" />
        </button>
        <h1 className="text-lg font-semibold text-gray-800">{product.name}</h1>
      </div>

      {/* ===== Ảnh sản phẩm (Carousel) ===== */}
      <div className="relative w-full bg-white">
        {product.images?.length > 0 ? (
          <>
            <Image
              src={product.images[currentIndex]}
              alt={product.name}
              width={600}
              height={600}
              className="w-full h-80 object-cover cursor-pointer"
              onClick={() => setShowZoom(true)}
            />
            {/* Chấm điều hướng */}
            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-2">
              {product.images.map((_: any, i: number) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    i === currentIndex ? "bg-orange-500" : "bg-gray-300"
                  }`}
                ></div>
              ))}
            </div>
          </>
        ) : (
          <div className="w-full h-80 bg-gray-100 flex items-center justify-center text-gray-400">
            Không có ảnh
          </div>
        )}
      </div>

      {/* ===== Phần chi tiết ===== */}
      <div className="p-4 bg-white mt-2">
        <h2 className="text-2xl font-bold text-orange-600">{product.price} π</h2>
        <p className="text-gray-800 mt-1 font-medium">{product.name}</p>

        <div className="flex justify-between text-sm text-gray-500 mt-2">
          <span>🚚 Free Shipping</span>
          <span>📦 Tồn kho: {product.stock || 100}</span>
        </div>

        {product.description && (
          <p className="text-gray-600 mt-4 leading-relaxed">{product.description}</p>
        )}

        <p className="text-xs text-gray-400 mt-2">
          7 ngày đổi trả • Giao hàng trong 72h
        </p>
      </div>

      {/* ===== Nút hành động ===== */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t flex items-center justify-around py-3">
        <button
          className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-6 rounded-lg"
          onClick={() => alert("🛒 Thêm vào giỏ hàng")}
        >
          Add to Cart
        </button>

        <button
          className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-6 rounded-lg"
          onClick={() => alert("💰 Mua ngay")}
        >
          Buy Now
        </button>
      </div>

      {/* ===== Hiển thị ảnh phóng to ===== */}
      <AnimatePresence>
        {showZoom && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowZoom(false)}
          >
            <motion.img
              src={product.images[currentIndex]}
              alt="Zoomed product"
              className="max-h-[90vh] max-w-[90vw] rounded-lg"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
