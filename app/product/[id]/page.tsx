"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import "@/app/lib/i18n";
import { ArrowLeft, ShoppingCart, X } from "lucide-react";

interface Product {
  id: number;
  name: string;
  price: number;
  salePrice?: number;
  saleStart?: string;
  saleEnd?: string;
  finalPrice?: number;
  isSale?: boolean;
  description?: string;
  views?: number;
  sold?: number;
  images?: string[];
}

export default function ProductDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { addToCart, clearCart } = useCart();

  const translate = (key: string) => key; // giữ nguyên như cũ

  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [quantity] = useState(1);
  const [showLightbox, setShowLightbox] = useState(false);
  const [showZoom, setShowZoom] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load sản phẩm
  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await fetch("/api/products");
        const allProducts: Product[] = await res.json();
        const found = allProducts.find((p) => p.id.toString() === id.toString());

        if (found) {
          const now = new Date();
          const start = found.saleStart ? new Date(found.saleStart) : null;
          const end = found.saleEnd ? new Date(found.saleEnd) : null;

          let isSale = false;
          if (start && end && found.salePrice) {
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            if (now >= start && now <= end) isSale = true;
          }

          found.isSale = isSale;
          found.finalPrice = isSale ? found.salePrice || found.price : found.price;

          setProduct(found);

          const top = [...allProducts]
            .sort((a, b) => (b.views || 0) - (a.views || 0))
            .filter((p) => p.id !== found.id)
            .slice(0, 10);

          setRelated(top);
        }
      } catch (err) {
        console.error("❌ Lỗi tải sản phẩm:", err);
      } finally {
        setLoading(false);
      }
    }

    if (id) fetchProduct();
  }, [id]);

  // Tăng view mỗi 6 giờ
  useEffect(() => {
    if (!id) return;
    const key = `viewed_${id}`;
    const last = localStorage.getItem(key);
    const now = Date.now();

    if (!last || now - Number(last) > 6 * 60 * 60 * 1000) {
      localStorage.setItem(key, now.toString());
      fetch("/api/products/view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    }
  }, [id]);

  if (loading) return <p className="text-center mt-6">⏳ Đang tải...</p>;
  if (!product)
    return <p className="text-center mt-6 text-red-600">❌ Không tìm thấy sản phẩm.</p>;

  const validImages =
    product.images?.map((src) =>
      src.startsWith("http") ? src : `/uploads/${src.split("\\").pop()}`
    ) || [];

  const handleNext = () =>
    setCurrentIndex((prev) => (prev + 1) % validImages.length);

  const handlePrev = () =>
    setCurrentIndex((prev) =>
      prev === 0 ? validImages.length - 1 : prev - 1
    );

  const handleAddToCart = () => {
    addToCart({ ...product, quantity });
    router.push("/cart");
  };

  const handleCheckout = () => {
    clearCart();
    addToCart({ ...product, quantity });
    router.push("/checkout");
  };

  return (
    <div className="pb-36 bg-gray-50 min-h-screen">
      {/* HEADER */}
      <div className="fixed top-0 left-0 right-0 bg-white shadow z-50 flex items-center justify-between px-4 py-3 border-b">
        <button
          onClick={() => router.back()}
          className="text-gray-700 hover:text-orange-500 flex items-center gap-1"
        >
          <ArrowLeft size={22} />
          <span>{translate("back")}</span>
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

      {/* SLIDER */}
      <div
        className="relative w-full h-80 bg-white flex justify-center items-center overflow-hidden mt-14"
        onDoubleClick={() => setShowLightbox(true)}
      >
        {validImages.length > 0 ? (
          <img
            src={validImages[currentIndex]}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-gray-400">Không có ảnh</div>
        )}

        {/* Dots */}
        <div className="absolute bottom-3 flex justify-center w-full gap-2">
          {validImages.map((_, i) => (
            <span
              key={i}
              className={`w-2 h-2 rounded-full ${
                i === currentIndex ? "bg-orange-500" : "bg-gray-300"
              }`}
            ></span>
          ))}
        </div>
      </div>

      {/* Tên / Giá */}
      <div className="bg-white p-4 mt-2 shadow-sm flex justify-between items-center">
        <h2 className="text-lg font-semibold">{product.name}</h2>
        <div className="flex items-center gap-2">
          <p className="text-xl font-bold text-orange-600">
            π {product.finalPrice}
          </p>
          {product.isSale && (
            <p className="line-through text-gray-400 text-sm">π {product.price}</p>
          )}
        </div>
      </div>

      {/* Views */}
      <div className="bg-white px-4 pb-3 flex items-center gap-4 text-gray-500 text-sm border-b">
        <span>👁 {product.views ?? 0}</span>
        <span>🛒 {product.sold ?? 0} đã bán</span>
      </div>

      {/* Mô tả */}
      <div className="bg-white p-4">{product.description}</div>

      {/* Hình ảnh */}
      <div className="bg-white mt-3 p-4 space-y-4">
        {validImages.map((img, index) => (
          <img key={index} src={img} className="w-full rounded-lg shadow-sm" />
        ))}
      </div>

      {/* Nút hành động */}
      <div className="fixed bottom-16 left-0 right-0 bg-white border-t shadow-md flex justify-between px-3 py-2 z-50">
        <button
          onClick={handleAddToCart}
          className="flex-1 mx-1 bg-yellow-500 text-white font-semibold py-2 rounded-md"
        >
          Giỏ hàng
        </button>
        <button
          onClick={handleCheckout}
          className="flex-1 mx-1 bg-red-500 text-white font-semibold py-2 rounded-md"
        >
          Thanh toán
        </button>
      </div>

      {/* Lightbox */}
      {showLightbox && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center"
          onClick={() => setShowLightbox(false)}
        >
          <button
            onClick={() => setShowLightbox(false)}
            className="absolute top-5 right-5 text-white text-3xl"
          >
            <X />
          </button>

          <img
            src={validImages[currentIndex]}
            alt="Zoomed"
            className="object-contain w-full h-full"
          />
        </div>
      )}
    </div>
  );
}
