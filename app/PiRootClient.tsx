"use client";

import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/app/context/CartContext";
import { LanguageProvider } from "@/app/context/LanguageContext";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import PiProvider from "@/app/pi/PiProvider";
import PiStatus from "@/app/components/PiStatus";

export default function PiRootClient({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <AuthProvider>
        <CartProvider>
          <PiProvider />
          <Navbar />
          <main className="pt-20 px-3">
            <PiStatus />
            {children}
          </main>
          <BottomNav />
        </CartProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
