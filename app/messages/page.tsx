"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { FaCircle } from "react-icons/fa";

// Fake data – sau này thay bằng Firebase
const usersDemo = [
  { uid: "admin", name: "Admin Shop", avatar: "https://i.pravatar.cc/50?img=1", online: true },
  { uid: "minhduc", name: "Minh Đức", avatar: "https://i.pravatar.cc/50?img=2", online: false },
  { uid: "thuyanh", name: "Thúy Anh", avatar: "https://i.pravatar.cc/50?img=3", online: true },
  { uid: "ngoclinh", name: "Ngọc Linh", avatar: "https://i.pravatar.cc/50?img=4", online: true },
];

export default function MessagesPage() {
  const [users, setUsers] = useState(usersDemo);

  return (
    <main className="max-w-md mx-auto bg-white min-h-screen">
      {/* Header */}
      <header className="bg-purple-600 text-white p-4 text-center text-lg font-semibold">
        💬 Danh sách người có thể chat
      </header>

      {/* User List */}
      <div className="p-4 space-y-3">
        {users.map((user) => (
          <div
            key={user.uid}
            className="flex items-center justify-between p-3 border rounded-lg shadow-sm hover:bg-gray-50 transition"
          >
            <div className="flex items-center space-x-3">
              <div className="relative">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-12 h-12 rounded-full border"
                />
                <FaCircle
                  className={`absolute bottom-0 right-0 text-xs ${
                    user.online ? "text-green-500" : "text-gray-400"
                  }`}
                />
              </div>
              <div>
                <p className="font-semibold">{user.name}</p>
                <p className="text-sm text-gray-500">
                  {user.online ? "Đang hoạt động" : "Ngoại tuyến"}
                </p>
              </div>
            </div>

            <Link
              href={`/chat/${user.uid}`}
              className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded-md text-sm"
            >
              Chat
            </Link>
          </div>
        ))}
      </div>
    </main>
  );
}
