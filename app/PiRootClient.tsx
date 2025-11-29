"use client";

import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/app/context/CartContext";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import PiProvider from "@/app/pi/PiProvider";
import PiStatus from "@/app/components/PiStatus";
import "@/app/lib/i18n"; // 👉 Import i18n để khởi tạo đa ngôn ngữ (thay cho LanguageProvider)

export default function PiRootClient({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>
        <PiProvider />
        <Toaster position="top-center" reverseOrder={false} />

        <Navbar />

        {/* ⭐ FULL WIDTH - KHÔNG PADDING - NỀN TRẮNG */}
        <main className="pt-20 w-full bg-white">
          <PiStatus />
          {children}
        </main>

        <BottomNav />
      </CartProvider>
    </AuthProvider>
  );
}
