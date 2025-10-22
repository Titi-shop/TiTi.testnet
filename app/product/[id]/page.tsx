"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCart } from "../../context/CartContext";
import { useLanguage } from "../../context/LanguageContext";

export default function ProductDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mainImage, setMainImage] = useState<string | null>(null);
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
        if (found) {
          setProduct(found);
          if (found.images?.length > 0) {
            const valid = found.images.map((src: string) =>
              src.startsWith("http") || src.startsWith("https")
                ? src
                : `/uploads/${src.split("\\").pop()}`
            );
            setMainImage(valid[0]);
          }
        }
      } catch (err) {
        console.error("❌ Lỗi khi tải sản phẩm:", err);
      } finally {
        setLoading(false);
      }
    }

    if (id) fetchProduct();
  }, [id]);

  // ✅ Thêm vào giỏ hàng
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
      quantity,
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

  const validImages =
    product.images?.map((src: string) =>
      src.startsWith("http") || src.startsWith("https")
        ? src
        : `/uploads/${src.split("\\").pop()}`
    ) || [];

  return (
    <div className="pb-28 bg-gray-50 min-h-screen">
      {/* 🖼️ Ảnh sản phẩm chính */}
      <div className="w-full flex flex-col items-center bg-white shadow-sm pb-4">
        {mainImage ? (
          <img
            src={mainImage}
            alt={product.name}
            className="w-full max-w-md h-80 object-cover rounded-lg"
          />
        ) : (
          <div className="w-full h-64 flex items-center justify-center bg-gray-100 text-gray-400">
            {translate("no_image")}
          </div>
        )}

        {/* 🔹 Dải ảnh nhỏ bên dưới */}
        {validImages.length > 1 && (
          <div className="flex gap-2 mt-3 overflow-x-auto px-3">
            {validImages.map((img: string, idx: number) => (
              <img
                key={idx}
                src={img}
                onClick={() => setMainImage(img)}
                className={`w-16 h-16 object-cover rounded-md cursor-pointer border-2 ${
                  mainImage === img ? "border-orange-500" : "border-transparent"
                }`}
                alt={`thumb-${idx}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* 🏷️ Thông tin sản phẩm */}
      <div className="p-4 max-w-3xl mx-auto bg-white mt-3 rounded-lg shadow-sm">
        <h1 className="text-2xl font-bold mb-3">{product.name}</h1>

        {/* 💰 Giá + số lượng song song */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-xl text-orange-600 font-semibold">
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

        {/* 📜 Mô tả */}
        <p className="text-gray-700 leading-relaxed">{product.description}</p>

        {/* 🏬 Tồn kho */}
        <p className="text-gray-400 text-sm mt-3">
          {translate("stock")}: {product.stock ?? 0}
        </p>
      </div>

      {/* 🛍️ Thanh hành động cố định */}
      <div className="fixed bottom-16 left-0 right-0 bg-white border-t shadow-lg flex justify-around py-3 z-50">
        <button
          onClick={handleAddToCart}
          className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold px-6 py-2 rounded-lg w-1/2 mx-2"
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
          } text-white font-semibold px-6 py-2 rounded-lg w-1/2 mx-2`}
        >
          💳 {translate("checkout_now")}
        </button>
      </div>
    </div>
  );
}
