"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCart } from "../../context/CartContext";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ShoppingCart } from "lucide-react";

export default function ProductDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showImage, setShowImage] = useState(false);

  const { addToCart } = useCart();

  // ✅ Lấy sản phẩm theo ID
  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await fetch("/api/products");
        const products = await res.json();
        const found = products.find((p: any) => p.id.toString() === id.toString());
        setProduct(found);
      } catch (err) {
        console.error("❌ Lỗi khi tải sản phẩm:", err);
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchProduct();
  }, [id]);

  // ✅ Tự động trượt ảnh
  useEffect(() => {
    if (product?.images?.length > 1) {
      const timer = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % product.images.length);
      }, 4000);
      return () => clearInterval(timer);
    }
  }, [product]);

  // ✅ Mở modal chọn số lượng
  const handleAddToCart = () => {
    setShowModal(true);
  };

  // ✅ Xác nhận thêm giỏ hàng
  const confirmAddToCart = () => {
    if (!product) return;
    addToCart({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      description: product.description,
      images: product.images,
      quantity,
    });
    setShowModal(false);
    alert("✅ Đã thêm sản phẩm vào giỏ hàng!");
    router.push("/cart");
  };

  // ✅ Mua ngay
  const handleCheckout = () => {
    if (!product) return;
    addToCart({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      description: product.description,
      images: product.images,
      quantity,
    });
    router.push("/checkout");
  };

  if (loading)
    return <p className="text-center mt-6">⏳ Đang tải sản phẩm...</p>;

  if (!product)
    return (
      <p className="text-center mt-6 text-red-600 font-medium">
        ❌ Không tìm thấy sản phẩm.
      </p>
    );

  const images = product.images?.map((src: string) =>
    src.startsWith("http") ? src : `/uploads/${src.split("\\").pop()}`
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-40">
      {/* 🔹 Thanh điều hướng */}
      <div className="fixed top-0 left-0 right-0 bg-white shadow z-50 flex items-center justify-between px-4 py-3">
        <button
          onClick={() => router.back()}
          className="text-gray-700 hover:text-orange-500 flex items-center gap-1"
        >
          <ArrowLeft size={22} /> <span>Quay lại</span>
        </button>
        <h1 className="font-semibold text-lg">Chi tiết sản phẩm</h1>
        <button
          onClick={() => router.push("/cart")}
          className="text-gray-700 hover:text-orange-500"
        >
          <ShoppingCart size={24} />
        </button>
      </div>

      {/* 🖼️ Ảnh sản phẩm */}
      <div className="mt-16 w-full max-w-md mx-auto relative">
        {images?.length > 0 ? (
          <AnimatePresence>
            <motion.img
              key={currentIndex}
              src={images[currentIndex]}
              alt={product.name}
              onClick={() => setShowImage(true)}
              className="w-full h-80 object-cover rounded-lg shadow cursor-pointer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
            />
          </AnimatePresence>
        ) : (
          <div className="w-full h-80 flex items-center justify-center bg-gray-200 text-gray-500">
            Không có hình ảnh
          </div>
        )}

        {/* Dấu chấm chuyển ảnh */}
        {images?.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
            {images.map((_: any, i: number) => (
              <span
                key={i}
                className={`w-2.5 h-2.5 rounded-full ${
                  i === currentIndex ? "bg-orange-500" : "bg-gray-300"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* 💰 Thông tin */}
      <div className="px-4 mt-5">
        <p className="text-orange-600 font-bold text-2xl">π {product.price}</p>
        <h2 className="text-lg font-semibold mt-2">{product.name}</h2>
        <p className="text-gray-600 mt-1">{product.description}</p>
        <p className="text-sm text-gray-400 mt-3">🏬 Tồn kho: {product.stock ?? 0}</p>
      </div>

      {/* 🛍️ Nút hành động */}
      <div className="fixed bottom-16 left-0 right-0 bg-white border-t shadow-lg flex justify-around py-3 z-50">
        <button
          onClick={handleAddToCart}
          className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold px-6 py-2 rounded-lg w-1/2 mx-2"
        >
          🛒 Thêm vào giỏ hàng
        </button>
        <button
          onClick={handleCheckout}
          className="bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-2 rounded-lg w-1/2 mx-2"
        >
          💳 Mua ngay
        </button>
      </div>

      {/* 🪟 Modal chọn số lượng + nút xác nhận */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50"
          onClick={() => setShowModal(false)}
        >
          <motion.div
            initial={{ y: 300 }}
            animate={{ y: 0 }}
            exit={{ y: 300 }}
            transition={{ duration: 0.3 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-md rounded-t-2xl p-5"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">{product.name}</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-red-500 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            <p className="text-orange-600 font-bold mb-2">π {product.price}</p>
            <p className="text-gray-500 text-sm mb-4">Tồn kho: {product.stock ?? 0}</p>

            {/* Chọn số lượng */}
            <div className="flex items-center justify-between border rounded-lg px-3 py-2 mb-4">
              <span className="font-semibold text-gray-700">Số lượng</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="bg-gray-200 px-3 py-1 rounded"
                >
                  -
                </button>
                <span>{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="bg-gray-200 px-3 py-1 rounded"
                >
                  +
                </button>
              </div>
            </div>

            {/* ✅ Nút xác nhận thêm vào giỏ hàng */}
            <button
              onClick={confirmAddToCart}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 rounded-lg shadow"
            >
              🛒 Xác nhận thêm vào giỏ hàng
            </button>
          </motion.div>
        </div>
      )}

      {/* 🖼️ Ảnh phóng to toàn màn hình */}
      {showImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50"
          onClick={() => setShowImage(false)}
        >
          <img
            src={images[currentIndex]}
            alt="Ảnh sản phẩm"
            className="max-h-[90%] max-w-[90%] object-contain"
          />
          <button
            onClick={() => setShowImage(false)}
            className="absolute top-6 right-6 text-white text-4xl font-bold"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
