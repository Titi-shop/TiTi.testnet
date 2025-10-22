"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCart } from "../../context/CartContext";
import { useLanguage } from "../../context/LanguageContext";
import { ShoppingCart, ArrowLeft } from "lucide-react";

export default function ProductDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [currentIndex, setCurrentIndex] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);
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

  // ✅ Thêm giỏ hàng
  const handleAddToCart = () => {
    if (!product) return;
    addToCart({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      description: product.description,
      images: product.images,
      quantity,
    });
    alert("✅ " + translate("added_to_cart"));
  };

  // ✅ Mua ngay
  const handleCheckout = () => {
    if (!product) return;
    clearCart();
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

  // ✅ Vuốt qua lại bằng tay
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!sliderRef.current) return;
    const x = e.touches[0].clientX;
    const width = sliderRef.current.offsetWidth;
    const newIndex = Math.round(x / width);
    setCurrentIndex(newIndex);
  };

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
      src.startsWith("http") || src.startsWith("https")
        ? src
        : `/uploads/${src.split("\\").pop()}`
    ) || [];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* 🔝 Thanh điều hướng */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b shadow-sm flex items-center justify-between px-3 py-2">
        <button
          onClick={() => router.back()}
          className="text-gray-700 hover:text-orange-500 flex items-center gap-1"
        >
          <ArrowLeft size={22} /> <span>{translate("back")}</span>
        </button>
        <span className="font-semibold text-base truncate max-w-[60%] text-center">
          {product.name || translate("product_details")}
        </span>
        <button
          onClick={() => router.push("/cart")}
          className="text-gray-700 hover:text-orange-500"
        >
          <ShoppingCart size={22} />
        </button>
      </div>

      {/* 🖼️ Ảnh sản phẩm có thể kéo */}
      <div className="mt-12 relative">
        <div
          ref={sliderRef}
          className="flex overflow-x-scroll snap-x snap-mandatory scroll-smooth"
          onTouchMove={handleTouchMove}
        >
          {validImages.length > 0 ? (
            validImages.map((src, i) => (
              <img
                key={i}
                src={src}
                alt={`image-${i}`}
                className="snap-center w-full h-80 object-cover"
              />
            ))
          ) : (
            <div className="w-full h-80 flex items-center justify-center bg-gray-100 text-gray-400">
              {translate("no_image")}
            </div>
          )}
        </div>

        {/* 🔘 Dấu chấm slide */}
        {validImages.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
            {validImages.map((_, i) => (
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

      {/* 🏷️ Thông tin sản phẩm */}
      <div className="p-4 bg-white mt-3 rounded-lg shadow-sm mx-2">
        {/* 💰 Giá + số lượng */}
        <div className="flex items-center justify-between mb-2">
          <p className="text-xl font-semibold text-orange-600">
            π {product.price}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="bg-gray-200 px-3 py-1 rounded text-lg"
            >
              -
            </button>
            <span className="text-base font-semibold">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="bg-gray-200 px-3 py-1 rounded text-lg"
            >
              +
            </button>
          </div>
        </div>

        <h1 className="text-lg font-bold mb-2">{product.name}</h1>
        <p className="text-gray-700 leading-relaxed">{product.description}</p>

        <p className="text-gray-400 text-sm mt-3">
          {translate("stock")}: {product.stock ?? 0}
        </p>
      </div>

      {/* 🛍️ Nút nhỏ phía trên */}
      <div className="fixed top-2 left-1/2 -translate-x-1/2 z-40 flex gap-3 bg-white/90 rounded-full shadow px-3 py-1">
        <button
          onClick={handleAddToCart}
          className="bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-semibold px-4 py-1 rounded-full"
        >
          🛒 {translate("add_to_cart")}
        </button>
        <button
          onClick={handleCheckout}
          disabled={product.stock === 0}
          className={`${
            product.stock === 0
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-red-500 hover:bg-red-600"
          } text-white text-sm font-semibold px-4 py-1 rounded-full`}
        >
          💳 {translate("checkout_now")}
        </button>
      </div>
    </div>
  );
}
