"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Search, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [history, setHistory] = useState<string[]>([]);

  // 🧠 Lấy lịch sử tìm kiếm từ localStorage
  useEffect(() => {
    const saved = localStorage.getItem("searchHistory");
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  // 💾 Lưu lại lịch sử tìm kiếm
  const saveSearch = (term: string) => {
    if (!term.trim()) return;
    const updated = [term, ...history.filter((h) => h !== term)].slice(0, 10); // giới hạn 10 từ
    setHistory(updated);
    localStorage.setItem("searchHistory", JSON.stringify(updated));
  };

  // 🧹 Xoá lịch sử tìm kiếm
  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem("searchHistory");
  };

  // 🔍 Xử lý tìm kiếm
  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;

    saveSearch(query);

    try {
      const res = await fetch(`/api/products?search=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data.products || []);
    } catch (error) {
      console.error("❌ Lỗi tìm kiếm:", error);
    }
  };

  // 👉 Tìm lại từ lịch sử
  const handleHistoryClick = (term: string) => {
    setQuery(term);
    handleSearch();
  };

  return (
    <div className="min-h-screen bg-white">
      {/* 🔶 Thanh tìm kiếm cố định */}
      <div className="fixed top-0 left-0 right-0 bg-orange-500 z-50 px-3 py-3 flex items-center gap-2">
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

      {/* 🧩 Nội dung chính */}
      <div className="pt-16 px-3 pb-10">
        {/* 🕓 Lịch sử tìm kiếm */}
        {history.length > 0 && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold text-gray-800">Tìm kiếm gần đây</h3>
              <button
                onClick={clearHistory}
                className="text-sm text-red-500 flex items-center gap-1"
              >
                <Trash2 size={16} /> Xóa tất cả
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {history.map((term, i) => (
                <button
                  key={i}
                  onClick={() => handleHistoryClick(term)}
                  className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700 hover:bg-gray-200"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 🔍 Kết quả tìm kiếm */}
        {results.length > 0 ? (
          <>
            <h2 className="text-lg font-semibold mb-3 text-gray-800">
              Kết quả tìm kiếm
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {results.map((p, i) => (
                <div
                  key={i}
                  className="bg-white border rounded-lg p-2 shadow-sm flex flex-col items-center text-center hover:shadow-md transition"
                >
                  <img
                    src={p.image || "/no-image.png"}
                    alt={p.name}
                    className="w-full h-28 object-contain rounded-md mb-2"
                  />
                  <p className="text-sm text-gray-800 line-clamp-2">{p.name}</p>
                  {p.price && (
                    <p className="text-orange-600 text-sm mt-1 font-semibold">
                      {p.price} π
                    </p>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <h2 className="text-lg font-semibold mb-3 text-gray-800">Gợi ý tìm kiếm</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {[
                { name: "Nhớt Motul 5w30", img: "/uploads/motul.jpg" },
                { name: "Nước Làm Mát Yamaha", img: "/uploads/yamaha.jpg" },
                { name: "Miếng Lót Gót Chân", img: "/uploads/gotchan.jpg" },
                { name: "Bảng Vẽ Điện Tử", img: "/uploads/bangve.jpg" },
                { name: "Mút Tán Kem Nền", img: "/uploads/mut.jpg" },
                { name: "Kẹo Sâm Xtreme", img: "/uploads/keosam.jpg" },
              ].map((item, i) => (
                <div
                  key={i}
                  className="bg-white border rounded-lg p-2 shadow-sm flex flex-col items-center text-center hover:shadow-md transition"
                >
                  <img
                    src={item.img}
                    alt={item.name}
                    className="w-full h-28 object-contain rounded-md mb-2"
                  />
                  <p className="text-sm text-gray-800">{item.name}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
