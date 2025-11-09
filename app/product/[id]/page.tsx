"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCart } from "../../context/CartContext";
import { useLanguage } from "../../context/LanguageContext";
import { ArrowLeft, ShoppingCart } from "lucide-react";

export default function ProductDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showZoom, setShowZoom] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const { addToCart, clearCart } = useCart();
  const { translate } = useLanguage();

  // ✅ Lấy sản phẩm theo ID
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

  if (loading) return <p className="text-center mt-6">⏳ {translate("loading")}</p>;
  if (!product)
    return <p className="text-center mt-6 text-red-600 font-medium">❌ {translate("no_products")}</p>;

  const validImages =
    product.images?.map((src: string) =>
      src.startsWith("http") ? src : `/uploads/${src.split("\\").pop()}`
    ) || [];

  // ✅ Vuốt sang phải / trái để đổi ảnh
  const handleSwipe = (direction: "left" | "right") => {
    setCurrentIndex((prev) => {
      if (direction === "right") return (prev + 1) % validImages.length;
      return (prev - 1 + validImages.length) % validImages.length;
    });
  };

  // ✅ Mở / tắt khung ảnh phóng to
  const handleDoubleTap = () => {
    setShowZoom(!showZoom);
  };

  // ✅ Thêm vào giỏ hàng
  const handleAddToCart = () => {
    addToCart({ ...product, quantity });
    alert("✅ " + translate("added_to_cart"));
    router.push("/cart");
  };

  // ✅ Thanh toán ngay
  const handleCheckout = () => {
    clearCart();
    addToCart({ ...product, quantity });
    router.push("/checkout");
  };

  return (
    <div className="pb-28 bg-gray-50 min-h-screen">
      {/* 🔝 Thanh trên cùng */}
      <div className="fixed top-0 left-0 right-0 bg-white shadow z-50 flex items-center justify-between px-4 py-3 border-b">
        <button onClick={() => router.back()} className="text-gray-700 hover:text-orange-500 flex items-center gap-1">
          <ArrowLeft size={22} />
          <span className="font-medium">{translate("back")}</span>
        </button>
        <h1 className="text-base font-semibold text-gray-800 truncate max-w-[60%]">{product.name}</h1>
        <button onClick={() => router.push("/cart")} className="text-gray-700 hover:text-orange-500">
          <ShoppingCart size={22} />
        </button>
      </div>

      {/* 🖼️ Slider ảnh */}
      <div
        className="relative w-full h-80 bg-white flex justify-center items-center overflow-hidden mt-14"
        onDoubleClick={handleDoubleTap}
        onTouchStart={(e) => (e.target as HTMLElement).setAttribute("data-x", e.touches[0].clientX.toString())}
        onTouchEnd={(e) => {
          const startX = parseFloat((e.target as HTMLElement).getAttribute("data-x") || "0");
          const diff = e.changedTouches[0].clientX - startX;
          if (Math.abs(diff) > 50) handleSwipe(diff > 0 ? "left" : "right");
        }}
      >
        {validImages.length > 0 ? (
          <img
            src={validImages[currentIndex]}
            alt={product.name}
            className="w-full h-full object-cover transition-all duration-500"
          />
        ) : (
          <div className="text-gray-400">Không có ảnh</div>
        )}

        {/* 🔘 Chấm tròn chỉ báo */}
        <div className="absolute bottom-3 flex justify-center w-full gap-2">
          {validImages.map((_, i) => (
            <span
              key={i}
              className={`w-2 h-2 rounded-full ${i === currentIndex ? "bg-orange-500" : "bg-gray-300"}`}
            ></span>
          ))}
        </div>

        {/* 🔍 Ảnh phóng to */}
        {showZoom && (
          <div
            onClick={() => setShowZoom(false)}
            className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
          >
            <img
              src={validImages[currentIndex]}
              alt="Zoomed"
              className="w-[70%] h-[70%] object-contain rounded-lg"
            />
          </div>
        )}
      </div>

      {/* 🏷️ Thông tin */}
      <div className="p-4 max-w-3xl mx-auto bg-white mt-3 rounded-lg shadow-sm">
        <h1 className="text-2xl font-bold mb-2">{product.name}</h1>
        <p className="text-xl text-orange-600 font-semibold mb-2">π {product.price}</p>

        {/* 👁 Lượt xem / Đã bán / Đánh giá */}
        <div className="flex items-center gap-4 text-gray-500 text-sm mb-3">
          <span>👁 {product.views ?? 11}</span>
          <span>🛒 {product.sold ?? 0} đã bán</span>
          <span>⭐ 5.0</span>
        </div>

        {/* Số lượng */}
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="bg-gray-200 px-3 py-1 rounded">-</button>
          <span className="font-medium">{quantity}</span>
          <button onClick={() => setQuantity((q) => q + 1)} className="bg-gray-200 px-3 py-1 rounded">+</button>
        </div>

        <p className="text-gray-700 leading-relaxed">{product.description}</p>
      </div>

      {/* 🛍️ Nút hành động */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg flex justify-around py-3 z-50">
        <button
          onClick={handleAddToCart}
          className="flex items-center justify-center bg-yellow-500 hover:bg-yellow-600 text-white font-semibold px-4 py-2 rounded-lg w-[45%]"
        >
          🛒 {translate("add_to_cart")}
        </button>
        <button
          onClick={handleCheckout}
          className="flex items-center justify-center bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded-lg w-[45%]"
        >
          💳 {translate("checkout_now")}
        </button>
      </div>
    </div>
  );
}
