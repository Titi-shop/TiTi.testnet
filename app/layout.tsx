import "./globals.css";
import Script from "next/script";
import { AuthProvider } from "../context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { LanguageProvider } from "./context/LanguageContext";
import BottomNav from "../components/BottomNav";
import LoginWithPi from "./components/LoginWithPi";
import PiSessionWatcher from "./components/PiSessionWatcher"; // ✅ THÊM DÒNG NÀY

export const metadata = {
  title: "TiTi Shop",
  description: "Ứng dụng thương mại điện tử Pi Network",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <head>
        {/* ✅ Pi SDK - chỉ hoạt động trong Pi Browser */}
        <Script
          src="https://sdk.minepi.com/pi-sdk.js"
          strategy="beforeInteractive"
        />
        <Script id="pi-init" strategy="afterInteractive">
          {`
            if (typeof window !== "undefined") {
              window.addEventListener("load", () => {
                if (window.Pi) {
                  console.log("✅ Pi SDK loaded:", window.Pi);
                  window.Pi.init({ version: "2.0", sandbox: false });
                } else {
                  console.warn("⚠️ Pi SDK chưa load, hãy mở bằng Pi Browser.");
                }
              });
            }
          `}
        </Script>
      </head>

      <body className="relative pb-16 bg-gray-50">
        <LanguageProvider>
          <AuthProvider>
            <CartProvider>
              {/* ✅ Tự động đăng nhập nếu có sẵn thông tin */}
              <LoginWithPi />

              {/* ✅ Giữ trạng thái đăng nhập đồng bộ toàn app */}
              <PiSessionWatcher />

              {/* ✅ Nội dung chính */}
              {children}

              {/* ✅ Thanh điều hướng cố định dưới màn hình */}
              <BottomNav />
            </CartProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
