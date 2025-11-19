"use client";

import Link from "next/link";
import { useState } from "react";
import { FiSearch, FiMessageCircle } from "react-icons/fi";

export default function MessagesPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const searchUser = async () => {
    if (!query.trim()) return;
    setLoading(true);
    const res = await fetch(`/api/users/search?q=${query.trim()}`);
    const data = await res.json();
    setResults(data);
    setLoading(false);
  };

  return (
    <main className="max-w-md mx-auto bg-gray-50 min-h-screen p-4">
      {/* Header */}
      <header className="bg-orange-500 text-white p-4 text-center text-lg font-semibold rounded-lg shadow-md">
        🔎 Tìm người để chat
      </header>

      {/* Search Bar */}
      <div className="flex gap-2 my-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Nhập username hoặc tên hiển thị..."
          className="flex-1 border border-gray-300 p-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
        <button
          onClick={searchUser}
          className="bg-orange-500 hover:bg-orange-600 transition text-white px-4 rounded-lg flex items-center gap-1 shadow"
        >
          <FiSearch /> Tìm
        </button>
      </div>

      {loading && (
        <p className="text-orange-500 font-medium text-center">
          ⏳ Đang tìm kiếm...
        </p>
      )}

      {/* Results List */}
      <div className="space-y-3">
        {!loading && results.length === 0 && (
          <p className="text-gray-500 text-center">Không tìm thấy người dùng</p>
        )}

        {results.map((user) => (
          <div
            key={user.username}
            className="flex items-center justify-between p-3 bg-white border rounded-xl shadow-sm hover:shadow-md transition"
          >
            <div className="flex items-center gap-3">
              <img
                src={user.avatar || "https://i.pravatar.cc/50"}
                alt={user.appName}
                className="w-12 h-12 rounded-full border"
              />
              <div>
                <p className="font-semibold text-gray-800">{user.appName}</p>
                <p className="text-sm text-gray-500">@{user.username}</p>
              </div>
            </div>

            <Link
              href={`/chat/${user.username}`}
              className="bg-orange-500 hover:bg-orange-600 transition text-white px-3 py-1.5 rounded-lg flex items-center gap-1 text-sm shadow"
            >
              <FiMessageCircle /> Chat
            </Link>
          </div>
        ))}
      </div>
    </main>
  );
}
