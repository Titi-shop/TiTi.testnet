"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";

interface Product {
  id: number;
  name: string;
  price: number;
  salePrice?: number | null;
  saleStart?: string | null;
  saleEnd?: string | null;
  images?: string[];
  seller: string;
}

interface Message {
  text: string;
  type: "success" | "error" | "";
}

export default function SellerStockPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, loading, piReady } = useAuth();

  const [role, setRole] = useState<string>("");
  const [sellerUser, setSellerUser] = useState<string>("");
  const [products, setProducts] = useState<Product[]>([]);
  const [pageLoading, setPageLoading] = useState(true);

  const [message, setMessage] = useState<Message>({
    text: "",
    type: "",
  });

  /* ============================================
     🔐 KIỂM TRA SELLER
  ============================================ */
  useEffect(() => {
    if (!loading && piReady) {
      if (!user) {
        router.push("/pilogin");
        return;
      }

      const username = user.username.trim().toLowerCase();
      setSellerUser(username);

      fetch(`/api/users/role?username=${username}`)
        .then((r) => r.json())
        .then((d) => {
          setRole(d.role);

          if (d.role !== "seller") {
            router.push("/no-access");
          } else {
            loadProducts(username);
          }
        });
    }
  }, [loading, piReady, user, router]);

  /* ============================================
     📦 Lấy sản phẩm theo seller
  ============================================ */
  async function loadProducts(username: string) {
    try {
      const res = await fetch(`/api/products`, { cache: "no-store" });
      let data: Product[] = await res.json();

      // LỌC THEO SELLER
      data = data.filter((p) => p.seller === username);

      setProducts(data);
    } catch {
      setMessage({ text: t.load_products_error, type: "error" });
    } finally {
      setPageLoading(false);
    }
  }

  /* ============================================
     ❌ Xóa sản phẩm
  ============================================ */
  const handleDelete = async (id: number) => {
    const product = products.find((p) => p.id === id);
    if (!product) return;

    if (!confirm(`${t.confirm_delete} "${product.name}"?`)) return;

    try {
      const res = await fetch(`/api/products?id=${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seller: sellerUser }),
      });

      const data = await res.json();

      if (data.success) {
        setMessage({ text: t.delete_success, type: "success" });
        loadProducts(sellerUser);
      } else {
        setMessage({ text: data.message, type: "error" });
      }
    } catch {
      setMessage({ text: t.delete_failed, type: "error" });
    }
  };

  /* ============================================
     ⏳ LOADING
  ============================================ */
  if (loading || pageLoading || !piReady || !user || role !== "seller") {
    return <main className="text-center p-8">⏳ {t.loading}</main>;
  }

  /* ============================================
     🎨 UI STOCK + THÊM GIÁ SALE
  ============================================ */
  return (
    <main className="p-4 max-w-2xl mx-auto pb-28">
      <button
        className="mb-4 text-blue-600 underline"
        onClick={() => router.push("/seller")}
      >
        ← {t.back}
      </button>

      <h1 className="text-2xl font-bold text-center mb-2 text-[#ff6600]">
        📦 {t.my_stock}
      </h1>

      <p className="text-center text-gray-500 mb-4">
        👤 {t.seller}: <b>{sellerUser}</b>
      </p>

      {message.text && (
        <p
          className={`text-center mb-3 ${
            message.type === "success"
              ? "text-green-600"
              : "text-red-600 font-medium"
          }`}
        >
          {message.text}
        </p>
      )}

      {products.length === 0 ? (
        <p className="text-center text-gray-400">{t.no_products}</p>
      ) : (
        <div className="space-y-4">
          {products.map((product) => {
            const now = new Date();
            const start = product.saleStart ? new Date(product.saleStart) : null;
            const end = product.saleEnd ? new Date(product.saleEnd) : null;

            const isSale =
              product.salePrice &&
              start &&
              end &&
              now >= start &&
              now <= end;

            const salePercent =
              isSale && product.price && product.salePrice
                ? Math.round(
                    ((product.price - product.salePrice) / product.price) * 100
                  )
                : 0;

            return (
              <div
                key={product.id}
                className="flex gap-3 p-3 bg-white rounded-lg shadow border relative"
              >
                {/* ⭐ BADGE SALE */}
                {isSale && (
                  <span className="absolute top-2 left-2 z-10 bg-red-600 text-white text-xs px-2 py-0.5 rounded-full shadow">
                    -{salePercent}%
                  </span>
                )}

                {/* Hình sản phẩm */}
                <div
                  className="w-24 h-24 relative rounded overflow-hidden cursor-pointer"
                  onClick={() => router.push(`/product/${product.id}`)}
                >
                  {product.images?.[0] ? (
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
                      {t.no_image}
                    </div>
                  )}
                </div>

                {/* Thông tin */}
                <div className="flex-1">
                  <h3 className="font-semibold truncate">{product.name}</h3>

                  {isSale ? (
                    <>
                      <p className="text-red-600 font-bold">
                        {product.salePrice} π
                      </p>
                      <p className="text-xs text-gray-500 line-through">
                        {product.price} π
                      </p>
                    </>
                  ) : (
                    <p className="text-[#ff6600] font-bold">{product.price} π</p>
                  )}

                  <div className="flex gap-4 mt-2">
                    <button
                      onClick={() =>
                        router.push(`/seller/edit/${product.id}`)
                      }
                      className="text-green-600 underline"
                    >
                      {t.edit}
                    </button>

                    <button
                      onClick={() => handleDelete(product.id)}
                      className="text-red-600 underline"
                    >
                      {t.delete}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
