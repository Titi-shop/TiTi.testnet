"use client";
import { useEffect } from "react";

export default function PiProvider() {
  useEffect(() => {
    const timer = setInterval(() => {
      if (typeof window !== "undefined" && window.Pi) {
        if (!window.__pi_initialized) {
          window.Pi.init({ version: "2.0", sandbox: true });
          window.__pi_initialized = true;
          console.log("✅ Pi SDK initialized (TESTNET)");
        }
        clearInterval(timer);
      } else {
        console.log("⏳ Pi SDK chưa sẵn sàng...");
      }
    }, 500);

    return () => clearInterval(timer);
  }, []);

  return null;
}
