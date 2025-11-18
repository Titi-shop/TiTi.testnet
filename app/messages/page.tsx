"use client";

import Link from "next/link";
import { useState } from "react";

export default function MessagesPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<string[]>([]);

  const searchUser = async () => {
    if (!query.trim()) return;
    const res = await fetch(`/api/users/search?q=${query.trim()}`);
    const data = await res.json();
    setResults(data);
  };

  return (
    <main className="max-w-md mx-auto bg-white min-h-screen p-4">
      {/* Header */}
      <header className="bg-purple-600 text-white p-4 text-center text-lg font-semibold">
        🔎 Tìm người để chat
      </header>

      {/* Tìm kiếm */}
      <div className="flex gap-2 my-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Nhập username (vd: admin, adc111...)"
          className="flex-1 border p-2 rounded"
        />
        <button
          onClick={searchUser}
          className="bg-purple-500 text-white px-3 rounded"
        >
          Tìm
        </button>
      </div>

      {/* Kết quả */}
      <div className="space-y-3">
        {results.length === 0 ? (
          <p className="text-gray-500">Không tìm thấy người dùng</p>
        ) : (
          results.map((uid) => (
            <div
              key={uid}
              className="flex justify-between items-center p-3 border rounded shadow-sm"
            >
              <span>{uid}</span>
              <Link
                href={`/chat/${uid}`}
                className="bg-purple-500 text-white px-3 py-1 rounded"
              >
                Chat
              </Link>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
