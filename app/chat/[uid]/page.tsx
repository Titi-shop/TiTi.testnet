"use client";

import { useAuth } from "@/context/AuthContext";
import { useState, useEffect, useRef } from "react";
import { db } from "@/firebaseConfig";
import { collection, addDoc, query, orderBy, onSnapshot } from "firebase/firestore";

export default function ChatPage({ params }: { params: { uid: string } }) {
  const { user } = useAuth(); // người đang đăng nhập
  const otherUid = params.uid; // người cần chat
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const chatId = [user?.username, otherUid].sort().join("_");

  useEffect(() => {
    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map((doc) => doc.data()));
    });

    return unsubscribe;
  }, [chatId]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    await addDoc(collection(db, "chats", chatId, "messages"), {
      sender: user?.username,
      text: input.trim(),
      timestamp: new Date(),
    });
    setInput("");
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <main className="flex flex-col h-screen max-w-md mx-auto bg-gray-100 pt-14 pb-20">
      {/* Header cố định tránh bị che */}
      <header className="bg-orange-500 text-white p-3 text-center fixed top-0 left-0 right-0 z-20">
        💬 Chat với {otherUid}
      </header>

      {/* Khu vực hiển thị tin nhắn */}
      <div className="flex-1 p-4 space-y-2 overflow-y-auto mt-12 mb-16">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`p-2 rounded-lg max-w-[75%] shadow-sm ${
              msg.sender === user?.username
                ? "ml-auto bg-orange-500 text-white"
                : "mr-auto bg-white text-gray-800"
            }`}
          >
            {msg.text}
            <div className="text-[10px] text-gray-300 mt-1">
              {new Date(msg.timestamp?.seconds * 1000).toLocaleTimeString()}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Khu nhập tin nhắn */}
      <div className="fixed bottom-0 left-0 right-0 bg-white p-3 flex gap-2 border-t">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Nhập tin nhắn..."
          className="flex-1 p-2 border rounded-lg shadow-sm"
        />
        <button
          onClick={sendMessage}
          className="bg-orange-500 text-white px-4 py-2 rounded-lg shadow-md"
        >
          Gửi
        </button>
      </div>
    </main>
  );
}
