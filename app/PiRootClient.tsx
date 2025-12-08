"use client";

import { Toaster } from "react-hot-toast";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";

import { CartProvider } from "@/app/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";

import "@/app/lib/i18n";

export default function PiRootClient({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>
        <Toaster position="top-center" reverseOrder={false} />

        {/* HEADER */}
        <Navbar />

        {/* ⭐ ĐẨY NỘI DUNG XUỐNG DƯỚI NAVBAR - FULL WIDTH */}
        <main className="pt-[72px] min-h-screen bg-white">
          {children}
        </main>

        {/* FOOTER */}
        <BottomNav />
      </CartProvider>
    </AuthProvider>
  );
}
