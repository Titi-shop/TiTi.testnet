import "./globals.css";
import Script from "next/script";
import { AuthProvider } from "../context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { LanguageProvider } from "./context/LanguageContext";
import BottomNav from "../components/BottomNav";
import Navbar from "../components/Navbar";
import LoginWithPi from "./components/LoginWithPi";
import PiSessionWatcher from "./components/PiSessionWatcher";

export const metadata = {
  title: "TiTi Shop",
  description: "Ứng dụng thương mại điện tử Pi Network",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <head>
        {/* ✅ Nạp Pi SDK */}
        <Script
          src="https://sdk.minepi.com/pi-sdk.js"
          strategy="beforeInteractive"
        />
      </head>

      <body className="relative pb-16 bg-gray-50">
        <LanguageProvider>
          <AuthProvider>
            <CartProvider>
              <Navbar />

              {/* ✅ Tự động đăng nhập nếu có sẵn user */}
              <LoginWithPi />

              {/* ✅ Giữ phiên Pi */}
              <PiSessionWatcher />

              <div className="pt-20">{children}</div>

              <BottomNav />
            </CartProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
