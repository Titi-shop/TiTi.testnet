import "./globals.css";
import Script from "next/script";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { LanguageProvider } from "./context/LanguageContext";
import BottomNav from "@/components/BottomNav";
import Navbar from "@/components/Navbar";
import PiProvider from "./pi/PiProvider"; // ✅ Thêm dòng này

export const metadata = {
  title: "🛍️ TiTi Shop",
  description: "Ứng dụng thương mại điện tử thanh toán qua Pi Network Testnet",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <head>
        {/* ⚙️ Tải SDK Pi */}
        <Script
          src="https://sdk.minepi.com/pi-sdk.js"
          strategy="afterInteractive"
          onLoad={() => {
            console.log("✅ Pi SDK script loaded (from layout.tsx)");
          }}
        />
      </head>

      <body className="relative min-h-screen bg-gray-50 text-gray-800 pb-16">
        {/* 🧠 Bao bọc các context */}
        <LanguageProvider>
          <AuthProvider>
            <CartProvider>
              {/* ✅ Khởi tạo Pi SDK ở client */}
              <PiProvider />

              <Navbar />
              <main className="pt-20 px-3">{children}</main>
              <BottomNav />
            </CartProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </
