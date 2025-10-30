"use client";
import PiProvider from "@/app/pi/PiProvider";
import PiStatus from "@/components/PiStatus";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { CartProvider } from "@/app/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import { LanguageProvider } from "@/app/context/LanguageContext";

export default function PiLayoutClient({ children }: { children: React.ReactNode }) {
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
