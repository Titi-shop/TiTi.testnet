"use client";
import PiProvider from "@/app/pi/PiProvider";
import PiStatus from "@/components/PiStatus";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/app/context/CartContext";
import { LanguageProvider } from "@/app/context/LanguageContext";

export default function PiLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <AuthProvider>
        <CartProvider>
          {/* ✅ Khởi tạo Pi SDK */}
          <PiProvider />

          {/* ✅ Giao diện chính */}
          <Navbar />
          <main className="pt-20 min-h-screen bg-gray-50 flex justify-center">
  <div className="w-[10cm] bg-white shadow-md rounded-lg p-4">
            <PiStatus />
            {children}
          </main>
          <BottomNav />
        </CartProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
