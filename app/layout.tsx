import "./globals.css";
import Script from "next/script";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { LanguageProvider } from "./context/LanguageContext";
import BottomNav from "@/components/BottomNav";
import Navbar from "@/components/Navbar";
import LoginWithPi from "@/app/components/LoginWithPi";
import PiSessionWatcher from "@/app/components/PiSessionWatcher";

export const metadata = {
  title: "🛍️ TiTi Shop",
  description: "Ứng dụng thương mại điện tử thanh toán qua Pi Network Testnet",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <head>
        {/* ✅ Nạp Pi SDK sớm nhất để window.Pi có sẵn */}
        <Script
  src="https://sdk.minepi.com/pi-sdk.js"
  strategy="afterInteractive"
/>
      </head>

      <body className="relative min-h-screen bg-gray-50 text-gray-800 pb-16">
        {/* ✅ Provider tổng hợp cho đa ngôn ngữ, đăng nhập và giỏ hàng */}
        <LanguageProvider>
          <AuthProvider>
            <CartProvider>
              {/* Thanh điều hướng trên */}
              <Navbar />

              {/* ✅ Theo dõi session Pi (tự load user nếu đã đăng nhập) */}
              <PiSessionWatcher />

              {/* ✅ Hiển thị login Pi nhanh (nếu chưa login) */}
              <div className="fixed top-16 right-4 z-40">
                <LoginWithPi />
              </div>

              {/* ✅ Phần nội dung chính */}
              <main className="pt-20 px-3">{children}</main>

              {/* Thanh điều hướng dưới cùng */}
              <BottomNav />
            </CartProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
