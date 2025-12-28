"use client";

import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/app/context/CartContext";

export default function PiLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
      <AuthProvider>
        <CartProvider>
          <Navbar />

          <main className="pt-20 min-h-screen w-full bg-white">
            {children}
          </main>

          <BottomNav />
        </CartProvider>
      </AuthProvider>
  );
}
