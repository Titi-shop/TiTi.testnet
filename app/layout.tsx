import "./globals.css";
import Script from "next/script";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { LanguageProvider } from "./context/LanguageContext";
import BottomNav from "@/components/BottomNav";
import Navbar from "@/components/Navbar";
import PiProvider from "./pi/PiProvider"; // ✅ Đảm bảo file này tồn tại

export const metadata = {
  title: "🛍️ TiTi Shop",
  description: "Ứng dụng thương mại điện tử thanh toán qua Pi Network Testnet",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <head>
        {/* ⚙️ Nạp SDK Pi Network — KHÔNG dùng onLoad (gây lỗi prerender) */}
        <Script src="https://sdk.minepi.com/pi-sdk.js" strategy="afterInteractive" />
      </head>

      <body className="relative min-h-screen bg-gray-50 text-gray-800 pb-16">
        {/* 🧠 Gói các provider toàn cục */}
        <LanguageProvider>
          <AuthProvider>
            <CartProvider>
              {/* ✅ Khởi tạo Pi SDK phía client */}
              <PiProvider />

              <Navbar />
              <main className="pt-20 px-3">{children}</main>
              <BottomNav />
            </CartProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
