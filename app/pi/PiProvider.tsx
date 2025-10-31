"use client";
import { useEffect } from "react";

export default function PiProvider() {
  useEffect(() => {
    const timer = setInterval(() => {
      if (typeof window !== "undefined" && window.Pi) {
        if (!window.__pi_initialized) {
          try {
            window.Pi.init({
              version: "2.0",
              sandbox: true, // ⚡ Testnet mode
            });
            window.__pi_initialized = true;
            console.log("✅ Pi SDK initialized (TESTNET)");
          } catch (err) {
            console.error("❌ Lỗi init Pi SDK:", err);
          }
        }
        clearInterval(timer);
      }
    }, 500);

    return () => clearInterval(timer);
  }, []);

  return null;
}
