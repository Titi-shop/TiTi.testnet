import "./globals.css";
import Script from "next/script";
import PiRootClient from "./PiRootClient"; // 👈 Import client layout

export const metadata = {
  title: "🛍️ TiTi Shop",
  description: "Ứng dụng thương mại điện tử thanh toán qua Pi Network Testnet",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <head>
        <Script
          src="https://sdk.minepi.com/pi-sdk.js"
          strategy="afterInteractive"
          onLoad={() => console.log("✅ Pi SDK script loaded")}
        />
      </head>
      <body>
        <PiRootClient>{children}</PiRootClient>
      </body>
    </html>
  );
}
