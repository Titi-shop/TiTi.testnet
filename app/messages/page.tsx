"use client";

import Link from "next/link";
import { useState } from "react";

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
    <main className="max-w-md mx-auto bg-white min-h-screen p-4">
      <header className="bg-purple-600 text-white p-4 text-center text-lg font-semibold rounded-lg">
        🔎 Tìm người để chat
      </header>

      <div className="flex gap-2 my-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Nhập username hoặc tên hiển thị..."
          className="flex-1 border p-2 rounded"
        />
        <button
          onClick={searchUser}
          className="bg-purple-500 text-white px-4 rounded"
        >
          Tìm
        </button>
      </div>

      {loading && <p>⏳ Đang tìm kiếm...</p>}

      <div className="space-y-3">
        {!loading && results.length === 0 && (
          <p className="text-gray-500">Không tìm thấy người dùng</p>
        )}

        {results.map((user) => (
          <div
            key={user.username}
            className="flex items-center justify-between p-3 border rounded-lg shadow-sm"
          >
            <div className="flex items-center gap-3">
              <img
                src={user.avatar || "https://i.pravatar.cc/50"}
                alt={user.appName}
                className="w-10 h-10 rounded-full border"
              />
              <div>
                <p className="font-semibold">{user.appName}</p>
                <p className="text-sm text-gray-500">@{user.username}</p>
              </div>
            </div>

            <Link
              href={`/chat/${user.username}`}
              className="bg-purple-500 text-white px-3 py-1 rounded"
            >
              Chat
            </Link>
          </div>
        ))}
      </div>
    </main>
  );
}
