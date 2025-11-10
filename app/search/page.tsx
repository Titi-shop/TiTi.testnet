"use client";

import { useEffect, useState } from "react";
import { Search, Trash2, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // 🧠 Load lịch sử tìm kiếm
  useEffect(() => {
    const stored = localStorage.getItem("recentSearch");
    if (stored) setRecent(JSON.parse(stored));
  }, []);

  // 💾 Lưu lịch sử tìm kiếm
  const saveRecent = (q: string) => {
    if (!q) return;
    const updated = [q, ...recent.filter((i) => i !== q)].slice(0, 5);
    setRecent(updated);
    localStorage.setItem("recentSearch", JSON.stringify(updated));
  };

  // 🔍 Xử lý tìm kiếm — lọc trên client, không cần chỉnh API
  const handleSearch = async () => {
    if (!query.trim()) return;
    saveRecent(query);
    setLoading(true);
    try {
      // Gọi API lấy toàn bộ sản phẩm
      const res = await fetch("/api/products");
      const data = await res.json();

      // Lọc theo tên, mô tả hoặc người bán
      const text = query.toLowerCase();
      const filtered = data.filter(
        (p: any) =>
          p.name?.toLowerCase().includes(text) ||
          p.description?.toLowerCase().includes(text) ||
          p.seller?.toLowerCase().includes(text)
      );

      setResults(filtered);
    } catch (err) {
      console.error("❌ Lỗi tìm kiếm:", err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // 🗑 Xóa lịch sử
  const clearRecent = () => {
    setRecent([]);
    localStorage.removeItem("recentSearch");
  };

  return (
    <div className="min-h-screen bg-white">
      {/* 🔸 Thanh tìm kiếm trên cùng */}
      <div className="sticky top-0 bg-orange-500 p-2 flex items-center z-50">
        <button
          onClick={() => router.back()}
          className="text-white mr-2 flex items-center"
        >
          <ArrowLeft size={22} />
        </button>
        <div className="flex flex-1 bg-white rounded-full overflow-hidden">
          <input
            type="text"
            placeholder="Nhập từ khóa tìm kiếm..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 px-4 py-2 text-sm outline-none"
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <button
            onClick={handleSearch}
            className="bg-orange-500 px-4 flex items-center justify-center"
          >
            <Search size={20} color="white" />
          </button>
        </div>
      </div>

      {/* 🔸 Lịch sử tìm kiếm */}
      {recent.length > 0 && (
        <div className="p-3">
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

      {/* 🔸 Kết quả tìm kiếm */}
      <div className="p-3">
        <h2 className="font-semibold text-gray-700 mb-2">Kết quả tìm kiếm</h2>

        {loading ? (
          <p className="text-center text-gray-400 mt-5">⏳ Đang tìm kiếm...</p>
        ) : results.length === 0 ? (
          <p className="text-center text-gray-500 mt-5">
            ❌ Không có sản phẩm nào.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {results.map((p) => (
              <div
                key={p.id}
                className="border rounded-lg p-2 flex flex-col items-center text-center shadow-sm"
              >
                <img
                  src={p.images?.[0] || "/no-image.png"}
                  alt={p.name}
                  className="w-full h-32 object-contain mb-1 rounded"
                />
                <p className="text-sm font-semibold line-clamp-2">{p.name}</p>
                <p className="text-orange-600 text-sm">{p.price} Pi</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
