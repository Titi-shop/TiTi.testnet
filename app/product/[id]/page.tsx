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
<div className="relative w-full bg-white flex flex-col items-center justify-center mt-14 overflow-hidden">
  {validImages.length > 0 ? (
    <>
      {/* Slider chính */}
      <div
        className="w-full h-80 flex transition-transform duration-500 ease-in-out"
        style={{
          transform: `translateX(-${currentIndex * 100}%)`,
          width: `${validImages.length * 100}%`,
        }}
        onDoubleClick={() => setShowLightbox(true)}
      >
        {validImages.map((img: string, i: number) => (
          <img
            key={i}
            src={img}
            alt={product.name}
            className="w-full h-80 object-contain flex-shrink-0"
          />
        ))}
      </div>

      {/* 🔵 Chấm nhỏ dưới ảnh */}
      <div className="flex justify-center mt-2">
        {validImages.map((_, i) => (
          <div
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`w-2.5 h-2.5 mx-1 rounded-full cursor-pointer transition-all duration-300 ${
              currentIndex === i ? "bg-blue-600 scale-110" : "bg-gray-300"
            }`}
          ></div>
        ))}
      </div>
    </>
  ) : (
    <div className="h-72 flex items-center justify-center text-gray-400">
      {translate("no_image")}
    </div>
  )}
</div>

{/* 🔍 Khung ảnh zoom khi chạm 2 lần */}
{showLightbox && (
  <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
    <button
      onClick={() => setShowLightbox(false)}
      className="absolute top-4 right-4 text-white text-3xl"
    >
      ✕
    </button>

    <div className="relative flex items-center justify-center">
      <img
        src={validImages[currentIndex]}
        alt="Zoomed"
        className="w-[70%] h-[70%] object-contain rounded-md shadow-lg"
      />
      {/* Nút chuyển ảnh */}
      {validImages.length > 1 && (
        <>
          <button
            onClick={() =>
              setCurrentIndex((prev) =>
                prev === 0 ? validImages.length - 1 : prev - 1
              )
            }
            className="absolute left-4 text-white text-4xl select-none"
          >
            ‹
          </button>
          <button
            onClick={() =>
              setCurrentIndex((prev) => (prev + 1) % validImages.length)
            }
            className="absolute right-4 text-white text-4xl select-none"
          >
            ›
          </button>
        </>
      )}
    </div>
  </div>
)}
