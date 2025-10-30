import "./globals.css";
import Script from "next/script";
import dynamic from "next/dynamic"; // ✅ Import dynamic để tránh SSR lỗi
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/app/context/CartContext";
import { LanguageProvider } from "@/app/context/LanguageContext";
import BottomNav from "@/components/BottomNav";
import Navbar from "@/components/Navbar";
import PiProvider from "@/app/pi/PiProvider";

// ✅ Import PiStatus dạng dynamic (client-only)
const PiStatus = dynamic(() => import("@/components/PiStatus"), { ssr: false });

export const metadata = {
  title: "🛍️ TiTi Shop",
  description: "Ứng dụng thương mại điện tử thanh toán qua Pi Network Testnet",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <head>
        {/* ✅ Nạp script Pi SDK sau khi client đã sẵn sàng */}
        <Script
          src="https://sdk.minepi.com/pi-sdk.js"
          strategy="afterInteractive"
          onLoad={() => console.log("✅ Pi SDK script loaded!")}
        />
      </head>

      <body className="relative min-h-screen bg-gray-50 text-gray-800 pb-16">
        <LanguageProvider>
          <AuthProvider>
            <CartProvider>
              {/* ✅ Khởi tạo Pi SDK */}
              <PiProvider />

              {/* ✅ Navbar & nội dung chính */}
              <Navbar />
              <main className="pt-20 px-3">
                <PiStatus />
                {children}
              </main>

              {/* ✅ Thanh điều hướng dưới */}
              <BottomNav />
            </CartProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
