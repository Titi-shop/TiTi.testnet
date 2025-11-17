import "./globals.css";
import Script from "next/script";
import PiRootClient from "./PiRootClient";
import { AuthProvider } from "@/context/AuthContext";
import PiAuthInit from "@/components/PiAuthInit"; // 👈 Thêm dòng này

export const metadata = {
  title: "🛍️ TiTi Shop",
  description: "Ứng dụng thương mại điện tử thanh toán qua Pi Network Testnet",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <head>
        {/* ✅ Load SDK Pi sau khi trang tương tác */}
        <Script src="https://sdk.minepi.com/pi-sdk.js" strategy="afterInteractive" />
      </head>

      <body>
        {/* ✅ Bọc AuthProvider ngoài cùng để quản lý trạng thái người dùng */}
        <AuthProvider>
          {/* ✅ PiAuthInit chạy ẩn, tự động login bằng Pi SDK */}
          <PiAuthInit />

          {/* ✅ Giao diện chính của app */}
          <PiRootClient>{children}</PiRootClient>
        </AuthProvider>
      </body>
    </html>
  );
}
