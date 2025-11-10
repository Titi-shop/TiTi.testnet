"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Search, Trash2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [savedProducts, setSavedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // 🧠 Load lịch sử tìm kiếm & sản phẩm đã lưu
  useEffect(() => {
    const storedRecent = localStorage.getItem("recentSearch");
    const storedProducts = localStorage.getItem("savedProducts");

    if (storedRecent) setRecent(JSON.parse(storedRecent));
    if (storedProducts) setSavedProducts(JSON.parse(storedProducts));
  }, []);

  // 💾 Lưu lịch sử tìm kiếm (chuỗi text)
  const saveRecent = (q: string) => {
    if (!q) return;
    const updated = [q, ...recent.filter((i) => i !== q)].slice(0, 5);
    setRecent(updated);
    localStorage.setItem("recentSearch", JSON.stringify(updated));
  };

  // 💾 Lưu danh sách sản phẩm đã tìm thấy
  const saveProducts = (list: any[]) => {
    const newList = [...savedProducts, ...list].reduce((acc: any[], p) => {
      if (!acc.some((item) => item.id === p.id)) acc.push(p);
      return acc;
    }, []);
    setSavedProducts(newList);
    localStorage.setItem("savedProducts", JSON.stringify(newList));
  };

  // 🔍 Xử lý tìm kiếm
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;
    saveRecent(query);
    setLoading(true);

    try {
      const res = await fetch("/api/products");
      const data = await res.json();

      const text = query.toLowerCase();
      const filtered = data.filter(
        (p: any) =>
          p.name?.toLowerCase().includes(text) ||
          p.description?.toLowerCase().includes(text) ||
          p.seller?.toLowerCase().includes(text)
      );

      setResults(filtered);
      saveProducts(filtered); // ✅ Lưu lại sản phẩm đã tìm được
    } catch (err) {
      console.error("❌ Lỗi khi tìm kiếm:", err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // 🗑 Xóa toàn bộ lịch sử
  const clearRecent = () => {
    setRecent([]);
    localStorage.removeItem("recentSearch");
  };

  // ❌ Xóa 1 sản phẩm đã lưu
  const removeSavedProduct = (id: number) => {
    const updated = savedProducts.filter((p) => p.id !== id);
    setSavedProducts(updated);
    localStorage.setItem("savedProducts", JSON.stringify(updated));
  };

  return (
    <div className="min-h-screen bg-white">
      {/* 🔶 Thanh tìm kiếm cố định trên cùng */}
      <div className="fixed top-0 left-0 right-0 bg-orange-500 z-50 px-3 py-3 flex items-center gap-2 shadow-md">
        <button
          onClick={() => router.back()}
          className="text-white hover:text-yellow-200"
        >
          <ArrowLeft size={24} />
        </button>

        <form
          onSubmit={handleSearch}
          className="flex-1 flex items-center bg-white rounded-md px-3"
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nhập từ khóa tìm kiếm..."
            className="flex-1 text-gray-800 py-2 outline-none text-sm"
          />
          <button type="submit" className="text-orange-600">
            <Search size={22} />
          </button>
        </form>
      </div>

      {/* 🔸 Nội dung chính bên dưới */}
      <div className="pt-20 px-3 pb-10">
        {/* Lịch sử tìm kiếm */}
        {recent.length > 0 && (
          <div className="mb-5">
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-semibold text-gray-700">Tìm kiếm gần đây</h2>
              <button
                onClick={clearRecent}
                className="text-red-500 text-sm flex items-center"
              >
                <Trash2 size={14} className="mr-1" /> Xóa tất cả
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {recent.map((item) => (
                <button
                  key={item}
                  onClick={() => {
                    setQuery(item);
                    handleSearch();
                  }}
                  className="bg-gray-100 px-3 py-1 rounded-full text-sm hover:bg-gray-200"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Kết quả tìm kiếm */}
        <h2 className="text-lg font-semibold mb-3 text-gray-800">
          {loading
            ? "⏳ Đang tìm kiếm..."
            : results.length > 0
            ? "Kết quả tìm kiếm"
            : savedProducts.length > 0
            ? "Sản phẩm đã lưu"
            : "Không có kết quả tìm kiếm"}
        </h2>

        {/* Hiển thị kết quả hoặc danh sách sản phẩm đã lưu */}
        {loading ? (
          <p className="text-center text-gray-400 mt-5">Đang tải dữ liệu...</p>
        ) : results.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {results.map((p) => (
              <div
                key={p.id}
                className="bg-white border rounded-lg p-2 shadow-sm flex flex-col items-center text-center hover:shadow-md transition"
              >
                <img
                  src={p.images?.[0] || "/no-image.png"}
                  alt={p.name}
                  className="w-full h-28 object-contain rounded-md mb-2"
                />
                <p className="text-sm font-semibold line-clamp-2">{p.name}</p>
                <p className="text-orange-600 text-sm">{p.price} Pi</p>
              </div>
            ))}
          </div>
        ) : savedProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {savedProducts.map((p) => (
              <div
                key={p.id}
                className="relative bg-white border rounded-lg p-2 shadow-sm flex flex-col items-center text-center hover:shadow-md transition"
              >
                <button
                  onClick={() => removeSavedProduct(p.id)}
                  className="absolute top-1 right-1 text-red-500 hover:text-red-700"
                  title="Xóa sản phẩm này"
                >
                  <XCircle size={18} />
                </button>
                <img
                  src={p.images?.[0] || "/no-image.png"}
                  alt={p.name}
                  className="w-full h-28 object-contain rounded-md mb-2"
                />
                <p className="text-sm font-semibold line-clamp-2">{p.name}</p>
                <p className="text-orange-600 text-sm">{p.price} Pi</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-400 mt-10">
            🔍 Nhập từ khóa để tìm kiếm sản phẩm.
          </p>
        )}
      </div>
    </div>
  );
}
