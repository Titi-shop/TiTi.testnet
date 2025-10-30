"use client";
import { useEffect } from "react";

export default function PiProvider() {
  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof window !== "undefined") {
        console.log("🔎 window.Pi =", typeof (window as any).Pi);
      }

      if (typeof window !== "undefined" && (window as any).Pi) {
        try {
          const isTestnet =
            process.env.NEXT_PUBLIC_PI_ENV === "testnet" ||
            true; // ép testnet cho chắc
          (window as any).Pi.init({ version: "2.0", sandbox: isTestnet });
          console.log("✅ Pi SDK initialized!");
          clearInterval(interval);
        } catch (err) {
          console.error("❌ Pi.init error:", err);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return null;
}
