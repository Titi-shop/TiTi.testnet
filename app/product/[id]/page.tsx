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
  const [related, setRelated] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);
  const [showZoom, setShowZoom] = useState(false);

  const [quantity, setQuantity] = useState(1);

  const { addToCart, clearCart } = useCart();
  const { translate } = useLanguage();

  // 🧠 Load sản phẩm
  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await fetch("/api/products");
        const products = await res.json();

        const found = products.find((p: any) => p.id.toString() === id.toString());
        setProduct(found);

        // ⭐ TẢI SẢN PHẨM LIÊN QUAN (cùng category, trừ sản phẩm hiện tại)
        if (found) {
          const sameCategory = products.filter(
            (p: any) =>
              p.categoryId === found.categoryId && p.id !== found.id
          );
          setRelated(sameCategory.slice(0, 10)); // lấy 10 cái thôi
        }
      } catch (err) {
        console.error("❌ Lỗi khi tải sản phẩm:", err);
      } finally {
        setLoading(false);
      }
    }

    if (id) fetchProduct();
  }, [id]);

  // ⭐⭐⭐ TĂNG LƯỢT XEM (VIEW)
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
    return <p className="text-center mt-6">⏳ Đang tải...</p>;
  if (!product)
    return (
      <p className="text-center mt-6 text-red-600 font-medium">
        ❌ Không tìm thấy sản phẩm!
      </p>
    );

  // Xử lý ảnh hợp lệ
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

  // 🛒 Giỏ hàng
  const handleAddToCart = () => {
    addToCart({ ...product, quantity });
    router.push("/cart"); // ⭐ CHUYỂN TRANG LUÔN
  };

  const handleCheckout = () => {
    clearCart();
    addToCart({ ...product, quantity });
    router.push("/checkout");
  };

  return (
    <div className="pb-36 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 bg-white shadow z-50 flex items-center justify-between px-4 py-3 border-b">
        <button
          onClick={() => router.back()}
          className="text-gray-700 hover:text-orange-500 flex items-center gap-1"
        >
          <ArrowLeft size={22} />
          <span className="font-medium">Quay lại</span>
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

      {/* Slider ảnh */}
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

        {/* Chấm tròn */}
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

      {/* Tên + Giá */}
      <div className="bg-white p-4 mt-2 shadow-sm flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800">{product.name}</h2>
        <p className="text-xl font-bold text-orange-600">π {product.price}</p>
      </div>

      {/* Views */}
      <div className="bg-white px-4 pb-3 flex items-center gap-4 text-gray-500 text-sm border-b">
        <span>👁 {product.views ?? 0}</span>
        <span>🛒 {product.sold ?? 0} đã bán</span>
      </div>

      {/* Mô tả */}
      <div className="bg-white p-4 text-gray-700 text-sm leading-relaxed whitespace-pre-line">
        {product.description}
      </div>

      {/* ⭐⭐⭐ SẢN PHẨM LIÊN QUAN — SCROLL NGANG ⭐⭐⭐ */}
      {related.length > 0 && (
        <div className="mt-3 bg-white p-4">
          <h3 className="font-semibold mb-2">Sản phẩm liên quan</h3>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {related.map((item) => (
              <div
                key={item.id}
                onClick={() => router.push(`/product/${item.id}`)}
                className="min-w-[120px] bg-gray-100 rounded shadow cursor-pointer"
              >
                <img
                  src={item.images?.[0]}
                  className="w-full h-24 object-cover rounded-t"
                />
                <div className="p-2 text-sm">
                  <p className="truncate">{item.name}</p>
                  <p className="font-bold text-orange-600">π {item.price}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ⭐⭐⭐ HIỂN THỊ TOÀN BỘ HÌNH ẢNH — DỌC ⭐⭐⭐ */}
      <div className="mt-3 bg-white p-4">
        <h3 className="font-semibold mb-2">Hình ảnh sản phẩm</h3>
        <div className="space-y-3">
          {validImages.map((img, i) => (
            <img
              key={i}
              src={img}
              className="w-full rounded-lg shadow"
            />
          ))}
        </div>
      </div>

      {/* Nút giỏ hàng + thanh toán */}
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
          <button className="absolute top-5 right-5 text-white text-3xl">
            <X />
          </button>
          <img
            src={validImages[currentIndex]}
            className="w-[90vw] max-h-[90vh] object-contain"
          />
        </div>
      )}
    </div>
  );
}
