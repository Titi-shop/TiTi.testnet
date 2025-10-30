import "./globals.css";
import Script from "next/script";
import dynamic from "next/dynamic";

// ✅ Import Client Layout (chứa PiProvider, Navbar, PiStatus...)
const PiLayoutClient = dynamic(() => import("./PiLayoutClient"), { ssr: false });

export const metadata = {
  title: "🛍️ TiTi Shop",
  description: "Ứng dụng thương mại điện tử thanh toán qua Pi Network Testnet",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <head>
        {/* ✅ Tải Pi SDK sau khi trang client render */}
        <Script
          src="https://sdk.minepi.com/pi-sdk.js"
          strategy="afterInteractive"
          onLoad={() => console.log("✅ Pi SDK script loaded!")}
        />
      </head>
      <body className="relative min-h-screen bg-gray-50 text-gray-800 pb-16">
        <PiLayoutClient>{children}</PiLayoutClient>
      </body>
    </html>
  );
}
