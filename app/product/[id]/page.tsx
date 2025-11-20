"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCart } from "../../context/CartContext";
import { useTranslations } from 'next-intl';
import { ArrowLeft, ShoppingCart, X } from "lucide-react";

export default function ProductDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);
  const [showZoom, setShowZoom] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const { addToCart, clearCart } = useCart();
  const t = useTranslations();
  const [related, setRelated] = useState<any[]>([]);

  const handleSwipe = (direction: string) => {
    if (direction === "left") handleNext();
    else handlePrev();
  };

  // 🧠 Load sản phẩm hiện tại
  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await fetch("/api/products");
        const products = await res.json();
        const found = products.find((p: any) => p.id.toString() === id.toString());

        if (found) {
          // =======================
          // ⭐ TÍNH GIÁ SALE CHUẨN
          // =======================
          const now = new Date();
          const start = found.saleStart ? new Date(found.saleStart) : null;
          const end = found.saleEnd ? new Date(found.saleEnd) : null;

          let isSale = false;

          if (start && end && found.salePrice) {
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);

            if (now.getTime() >= start.getTime() && now.getTime() <= end.getTime()) {
              isSale = true;
            }
          }

          found.isSale = isSale;
          found.finalPrice = isSale ? found.salePrice : found.price;

          setProduct(found);
        }

        // ⭐ Danh sách sản phẩm nổi bật
        const top = [...products]
          .sort((a, b) => (b.views || 0) - (a.views || 0))
          .filter((p) => p.id !== found?.id)
          .slice(0, 10);

        setRelated(top);
      } catch (err) {
        console.error("❌ Lỗi khi tải sản phẩm:", err);
      } finally {
        setLoading(false);
      }
    }

    if (id) fetchProduct();
  }, [id]);

  // ⭐⭐⭐ TĂNG LƯỢT XEM ⭐⭐⭐
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

      {/* ẢNH SLIDER */}
      <div
        className="relative w-full h-80 bg-white flex justify-center items-center overflow-hidden mt-14"
        onDoubleClick={() => setShowLightbox(true)}
        onTouchStart={(e) =>
          (e.currentTarget.dataset.x = e.touches[0].clientX.toString())
        }
        onTouchEnd={(e) => {
          const startX = parseFloat(e.currentTarget.dataset.x || "0");
          const diff = e.changedTouches[0].clientX - startX;
          if (Math.abs(diff) > 50)
            handleSwipe(diff > 0 ? "right" : "left");
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
        <h2 className="text-lg font-semibold text-gray-800">{product.name}</h2>
        <div className="flex items-center gap-2">
          <p className="text-xl font-bold text-orange-600">
            π {product.finalPrice}
          </p>

          {product.isSale && (
            <p className="line-through text-gray-400 text-sm">
              π {product.price}
            </p>
          )}
        </div>
      </div>

      {/* Views */}
      <div className="bg-white px-4 pb-3 flex items-center gap-4 text-gray-500 text-sm border-b">
        <span>👁 {product.views ?? 0}</span>
        <span>🛒 {product.sold ?? 0} đã bán</span>
        <span>⭐ 5.0</span>
      </div>

      {/* Mô tả */}
      <div className="bg-white p-4 text-gray-700 text-sm leading-relaxed whitespace-pre-line">
        {product.description}
      </div>

      {/* 🖼️ TOÀN BỘ ẢNH THEO CHIỀU DỌC */}
      <div className="bg-white mt-3 p-4 space-y-4">
        {validImages.map((img, index) => (
          <img
            key={index}
            src={img}
            className="w-full rounded-lg shadow-sm"
            alt="Ảnh sản phẩm"
          />
        ))}
      </div>

      {/* ⭐ SẢN PHẨM ĐƯỢC XEM NHIỀU NHẤT */}
      <div className="mt-6 p-4 bg-white shadow-sm">
        <h3 className="font-semibold text-lg mb-3">🔥 Sản phẩm nổi bật</h3>

        <div className="flex overflow-x-auto gap-4 pb-3">
          {related.map((p) => (
            <div
              key={p.id}
              className="min-w-[120px] bg-white border rounded-lg shadow-sm p-2"
              onClick={() => router.push(`/product/${p.id}`)}
            >
              <img
                src={
                  p.images?.[0]?.startsWith("http")
                    ? p.images[0]
                    : `/uploads/${p.images?.[0]?.split("\\").pop()}`
                }
                className="w-full h-20 object-cover rounded"
              />
              <p className="text-xs mt-1 line-clamp-1">{p.name}</p>
              <p className="text-orange-600 font-bold text-sm">
                π {p.price}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* BUTTON */}
      <div className="fixed bottom-16 left-0 right-0 bg-white border-t shadow-md flex justify-between px-3 py-2 z-50">
        <button
          onClick={handleAddToCart}
          className="flex-1 mx-1 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 rounded-md"
        >
          Giỏ hàng
        </button>
        <button
          onClick={handleCheckout}
          className="flex-1 mx-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 rounded-md"
        >
          Thanh toán
        </button>
      </div>

      {/* LIGHTBOX */}
      {showLightbox && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center"
          onClick={() => setShowLightbox(false)}
          onTouchStart={(e) =>
            (e.currentTarget.dataset.x = e.touches[0].clientX.toString())
          }
          onTouchEnd={(e) => {
            const startX = parseFloat(e.currentTarget.dataset.x || "0");
            const diff = e.changedTouches[0].clientX - startX;
            if (Math.abs(diff) > 50) {
              if (diff > 0) handlePrev();
              else handleNext();
            }
          }}
        >
          <button
            onClick={() => setShowLightbox(false)}
            className="absolute top-5 right-5 text-white text-3xl z-50"
          >
            <X />
          </button>

          <div className="w-[440px] h-[440px] bg-black rounded-lg flex items-center justify-center overflow-hidden">
            <img
              src={validImages[currentIndex]}
              alt="Zoomed"
              className="object-contain w-[100vw] h-[100vh] transition-transform duration-300 ease-in-out"
              style={{
                transformOrigin: "center center",
                transform: showZoom ? "scale(2)" : "scale(1)",
              }}
              onClick={(e) => {
                e.stopPropagation();
                setShowZoom((prev) => !prev);
              }}
            />
          </div>

          {validImages.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrev();
                }}
                className="absolute left-4 text-white text-4xl select-none"
              >
                ‹
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
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
