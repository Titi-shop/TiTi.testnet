"use client";

import { Toaster } from "react-hot-toast";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";

import { CartProvider } from "@/app/context/CartContext";

import "@/app/lib/i18n";

export default function PiRootClient({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <Toaster position="top-center" reverseOrder={false} />

      {/* HEADER */}
      <Navbar />

      <main className="pt-[72px] min-h-screen bg-white">
        {children}
      </main>

      <BottomNav />
    </CartProvider>
  );
}
