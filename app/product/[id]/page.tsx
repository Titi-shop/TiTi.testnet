"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCart } from "../../context/CartContext";
import { useLanguage } from "../../context/LanguageContext";
import { motion } from "framer-motion";

export default function ProductDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState<string | null>(null);
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
    <div className="pb-28"> {/* thêm padding-bottom tránh che nút */}
      {/* 🏷️ Tiêu đề */}
      <div className="p-4 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">{product.name}</h1>
        <p className="text-lg text-yellow-600 font-semibold mb-1">
          {product.price} π
        </p>
        <p className="text-gray-700 mb-4">{product.description}</p>
      </div>

      {/* 🖼️ Hình ảnh sản phẩm */}
      <div className="w-full flex justify-center">
        <div className="w-full max-w-md overflow-hidden rounded-xl shadow">
          {product.images?.length > 0 ? (
            <motion.div
              className="relative flex overflow-x-scroll snap-x snap-mandatory scroll-smooth"
              drag="x"
              dragConstraints={{ left: -300, right: 300 }}
            >
              {product.images.map((src: string, i: number) => {
                const validSrc =
                  src.startsWith("http") || src.startsWith("https")
                    ? src
                    : `/uploads/${src.split("\\").pop()}`;
                return (
                  <motion.img
                    key={i}
                    src={validSrc}
                    alt={`Image ${i + 1}`}
                    onClick={() => setActiveImage(validSrc)}
                    className="snap-center min-w-full h-80 object-cover cursor-pointer"
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.3 }}
                  />
                );
              })}
            </motion.div>
          ) : (
            <div className="w-full h-60 flex items-center justify-center bg-gray-100 text-gray-400">
              {translate("no_image")}
            </div>
          )}
        </div>
      </div>

      {/* 🛍️ Thanh hành động cố định - nằm trên thanh điều hướng */}
<div className="fixed bottom-16 left-0 right-0 bg-white border-t shadow-lg flex justify-around py-3 z-50">
  <button
    onClick={handleAddToCart}
    className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold px-6 py-2 rounded-lg w-1/2 mx-2"
  >
    🛒 {translate("add_to_cart")}
  </button>
  <button
    onClick={handleCheckout}
    className="bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-2 rounded-lg w-1/2 mx-2"
  >
    💳 {translate("checkout_now")}
  </button>
</div>

      {/* 🔍 Modal xem ảnh phóng to */}
      {activeImage && (
        <div
          onClick={() => setActiveImage(null)}
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
        >
          <img
            src={activeImage}
            alt="Full view"
            className="max-h-[90%] max-w-[90%] rounded-lg"
          />
          <button
            onClick={() => setActiveImage(null)}
            className="absolute top-6 right-6 text-white text-3xl font-bold"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
