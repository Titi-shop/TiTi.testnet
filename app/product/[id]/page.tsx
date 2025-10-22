"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCart } from "../../context/CartContext";
import { useLanguage } from "../../context/LanguageContext";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";

export default function ProductDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showZoom, setShowZoom] = useState(false);

  const { addToCart, clearCart } = useCart();
  const { translate } = useLanguage();

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

  // 🔁 Tự động đổi hình mỗi 5 giây
  useEffect(() => {
    if (!product?.images?.length) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % product.images.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [product]);

  // ✅ Thêm sản phẩm vào giỏ
  const handleAddToCart = () => {
    if (!product) return;
    addToCart({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      description: product.description,
      images: product.images,
    });
    alert("✅ " + translate("added_to_cart"));
    router.push("/cart");
  };

  // ✅ Thanh toán nhanh
  const handleCheckout = () => {
    if (!product) return;
    clearCart();
    addToCart({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      description: product.description,
      images: product.images,
    });
    router.push("/checkout");
  };

  if (loading)
    return <p className="text-center mt-6">⏳ {translate("loading")}</p>;

  if (!product)
    return (
      <p className="text-center mt-6 text-red-600 font-medium">
        ❌ {translate("no_products")}
      </p>
    );

  return (
    <main className="bg-gray-50 min-h-screen pb-24">
      {/* ===== Hình sản phẩm (carousel) ===== */}
      <div className="relative bg-white w-full">
        {product.images?.length > 0 ? (
          <>
            <Image
              src={
                product.images[currentIndex].startsWith("http")
                  ? product.images[currentIndex]
                  : `/uploads/${product.images[currentIndex].split("\\").pop()}`
              }
              alt={product.name}
              width={600}
              height={600}
              className="w-full h-80 object-cover cursor-pointer"
              onClick={() => setShowZoom(true)}
            />
            <div className="absolute bottom-2 w-full flex justify-center gap-2">
              {product.images.map((_: string, i: number) => (
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
            {translate("no_image")}
          </div>
        )}
      </div>

      {/* ===== Thông tin sản phẩm ===== */}
      <div className="p-5 bg-white mt-2 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">
          {product.name}
        </h1>
        <p className="text-orange-600 font-semibold text-xl mb-3">
          {product.price} π
        </p>
        <p className="text-gray-600 leading-relaxed">
          {product.description || translate("no_description")}
        </p>

        <div className="flex justify-between text-sm text-gray-500 mt-4">
          <span>🚚 Free Shipping</span>
          <span>📦 {translate("stock")}: {product.stock || 100}</span>
        </div>
      </div>

      {/* ===== Nút hành động ===== */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around py-3 shadow-lg">
        <button
          onClick={handleAddToCart}
          className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-6 rounded-lg"
        >
          🛒 {translate("add_to_cart")}
        </button>

        <button
          onClick={handleCheckout}
          className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-6 rounded-lg"
        >
          💳 {translate("checkout_now")}
        </button>
      </div>

      {/* ===== Phóng to ảnh ===== */}
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
              src={
                product.images[currentIndex].startsWith("http")
                  ? product.images[currentIndex]
                  : `/uploads/${product.images[currentIndex].split("\\").pop()}`
              }
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
