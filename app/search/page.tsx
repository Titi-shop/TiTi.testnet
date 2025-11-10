"use client";

import { useState } from "react";
import { ArrowLeft, Search } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("🔍 Tìm kiếm:", query);
    // TODO: Gọi API tìm kiếm thật ở đây
  };

  return (
    <div className="min-h-screen bg-white">
      {/* 🔶 Thanh tìm kiếm cố định trên cùng */}
      <div className="fixed top-0 left-0 right-0 bg-orange-500 z-50 px-3 py-3 flex items-center gap-2">
        <button
          onClick={() => router.back()}
          className="text-white hover:text-yellow-200"
        >
          <ArrowLeft size={24} />
        </button>

        <form onSubmit={handleSearch} className="flex-1 flex items-center bg-white rounded-md px-3">
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

      {/* 🔸 Nội dung chính bên dưới thanh tìm kiếm */}
      <div className="pt-16 px-3 pb-10">
        <h2 className="text-lg font-semibold mb-3 text-gray-800">
          Gợi ý tìm kiếm
        </h2>

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
      </div>
    </div>
  );
}
