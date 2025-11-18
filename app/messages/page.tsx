"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { db } from "@/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import { FaCircle } from "react-icons/fa";

export default function MessagesPage() {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const querySnapshot = await getDocs(collection(db, "users"));
      const usersList = querySnapshot.docs.map((doc) => doc.data());
      setUsers(usersList);
    };

    fetchUsers();
  }, []);

  return (
    <main className="max-w-md mx-auto bg-white min-h-screen">
      <header className="bg-purple-600 text-white p-4 text-center text-lg font-semibold">
        💬 Danh sách người có thể chat
      </header>

      <div className="p-4 space-y-3">
        {users.map((user) => (
          <div key={user.uid} className="flex items-center justify-between p-3 border rounded-lg shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <img src={user.avatar} className="w-12 h-12 rounded-full border" />
                <FaCircle
                  className={`absolute bottom-0 right-0 text-xs ${
                    user.online ? "text-green-500" : "text-gray-400"
                  }`}
                />
              </div>
              <div>
                <p className="font-semibold">{user.username}</p>
                <p className="text-sm text-gray-500">
                  {user.online ? "Đang hoạt động" : "Ngoại tuyến"}
                </p>
              </div>
            </div>

            <Link
              href={`/chat/${user.uid}`}
              className="bg-purple-500 text-white px-3 py-1 rounded-md"
            >
              Chat
            </Link>
          </div>
        ))}
      </div>
    </main>
  );
}
