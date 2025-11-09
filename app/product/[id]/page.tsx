"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCart } from "../../context/CartContext";
import { useLanguage } from "../../context/LanguageContext";
import { ArrowLeft, ShoppingCart, X } from "lucide-react";

export default function ProductDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const { addToCart, clearCart } = useCart();
  const { translate } = useLanguage();

  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await fetch("/api/products");
        const products = await res.json();
        const found = products.find((p: any) => p.id.toString() === id.toString());
        if (found) setProduct(found);
      } catch (err) {
        console.error("❌ Lỗi khi tải sản phẩm:", err);
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchProduct();
  }, [id]);

  if (loading)
    return <p className="text-center mt-6">⏳ {translate("loading")}</p>;
  if (!product)
    return (
      <p className="text-center mt-6 text-red-600 font-medium">
        ❌ {translate("no_products")}
      </p>
    );

  const validImages =
    product.images?.map((src: string) =>
      src.startsWith("http") ? src : `/uploads/${src.split("\\").pop()}`
    ) || [];

  const handleDoubleTap = () => {
    setShowLightbox(true);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % validImages.length);
  };
  const handlePrev = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? validImages.length - 1 : prev - 1
    );
  };

  const handleAddToCart = () => {
    addToCart({ ...product, quantity });
    alert("✅ " + translate("added_to_cart"));
  };

  const handleCheckout = () => {
    clearCart();
    addToCart({ ...product, quantity });
    router.push("/checkout");
  };

  return (
    <div className="pb-36 bg-gray-50 min-h-screen">
      {/* 🔝 Header */}
      <div className="fixed top-0 left-0 right-0 bg-white shadow z-50 flex items-center justify-between px-4 py-3 border-b">
        <button
          onClick={() => router.back()}
          className="text-gray-700 hover:text-orange-500 flex items-center gap-1"
        >
          <ArrowLeft size={22} />
          <span className="font-medium">{translate("back")}</span>
        </button>
        <h1 className="text-base font-semibold text-gray-800 truncate max-w-[60%]">
          {product.name}
        </h1>
        <button
          onClick={() => router.push("/cart")}
          className="text-gray-700 hover:text-orange-500"
        >
          <ShoppingCart size={22} />
        </button>
      </div>

      {/* 🖼️ Ảnh sản phẩm */}
      <div
        className="w-full bg-white flex justify-center items-center overflow-hidden mt-14"
        onDoubleClick={handleDoubleTap}
      >
        {validImages.length > 0 ? (
          <img
            src={validImages[currentIndex]}
            alt={product.name}
            className="w-full max-h-96 object-contain transition-all duration-300"
          />
        ) : (
          <div className="text-gray-400 h-80 flex items-center justify-center">
            {translate("no_image")}
          </div>
        )}
      </div>

      {/* 🧾 Tên + Giá Pi cùng hàng */}
      <div className="bg-white p-4 mt-2 shadow-sm flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800">{product.name}</h2>
        <p className="text-xl font-bold text-orange-600">π {product.price}</p>
      </div>

      {/* 👁 Thông tin thêm */}
      <div className="bg-white px-4 pb-3 flex items-center gap-4 text-gray-500 text-sm border-b">
        <span>👁 {product.views ?? 11}</span>
        <span>🛒 {product.sold ?? 0} đã bán</span>
        <span>⭐ 5.0</span>
      </div>

      {/* 📦 Mô tả */}
      <div className="bg-white p-4 text-gray-700 text-sm leading-relaxed">
        {product.description}
      </div>

      {/* 🛍️ Nút hành động - nằm trên thanh điều hướng */}
      <div className="fixed bottom-16 left-0 right-0 bg-white border-t shadow-md flex justify-between px-3 py-2 z-50">
        <button
          onClick={handleAddToCart}
          className="flex-1 mx-1 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 rounded-md"
        >
          🛒 Giỏ hàng
        </button>
        <button
          onClick={handleCheckout}
          className="flex-1 mx-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 rounded-md"
        >
          💳 Thanh toán
        </button>
      </div>

      {/* 🔍 Lightbox ảnh lớn */}
      {showLightbox && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
          <button
            onClick={() => setShowLightbox(false)}
            className="absolute top-5 right-5 text-white text-3xl"
          >
            <X />
          </button>
          <img
            src={validImages[currentIndex]}
            alt="Zoomed"
            className="max-h-[80%] max-w-[90%] object-contain"
          />
          {validImages.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-4 text-white text-4xl select-none"
              >
                ‹
              </button>
              <button
                onClick={handleNext}
                className="absolute right-4 text-white text-4xl select-none"
              >
                ›
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
