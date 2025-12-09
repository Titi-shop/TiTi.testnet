"use client";
import { useEffect } from "react";

declare global {
  interface Window {
    Pi?: any;
    __pi_initialized?: boolean;
  }
}

export default function PiAuthInit() {
  useEffect(() => {
    if (typeof window !== "undefined" && window.Pi && !window.__pi_initialized) {
      try {
        window.Pi.init({ version: "2.0", sandbox: false });
        window.__pi_initialized = true;
        console.log("✅ Pi SDK initialized");
      } catch (e) {
        console.error("❌ Lỗi init Pi SDK:", e);
      }
    }
  }, []);

  return null;
}
