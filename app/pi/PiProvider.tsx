"use client";
import { useEffect } from "react";

export default function PiProvider() {
  useEffect(() => {
    const timer = setInterval(() => {
      if (typeof window !== "undefined" && window.Pi) {
        if (!window.__pi_initialized) {
          const isTestnet = process.env.NEXT_PUBLIC_PI_ENV === "testnet";
          window.Pi.init({ version: "2.0", sandbox: isTestnet });
          window.__pi_initialized = true;
          console.log(`✅ Pi SDK initialized (${isTestnet ? "TESTNET" : "MAINNET"})`);
        }
        clearInterval(timer);
      }
    }, 400);
    return () => clearInterval(timer);
  }, []);

  return null;
}
