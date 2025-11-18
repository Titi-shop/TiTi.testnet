"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function ChatListPage() {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    // 🔹 Tạm demo danh sách user
    setUsers([
      { uid: "nguyenminhduc1991111", name: "Nguyễn Minh Đức" },
      { uid: "shop123", name: "Shop 123" },
      { uid: "admin", name: "Admin Hỗ trợ" },
    ]);
  }, []);

  return (
    <main className="p-4 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">💬 Chọn người để chat</h1>
      {users.map((u) => (
        <Link
          key={u.uid}
          href={`/chat/${u.uid}`}
          className="block p-3 mb-2 bg-white rounded-lg shadow hover:bg-gray-100"
        >
          {u.name}
        </Link>
      ))}
    </main>
  );
}
