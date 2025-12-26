"use client";
import { useEffect } from "react";

/** Khai báo kiểu Pi SDK tối thiểu để tránh any */
interface PiSDK {
  init: (config: { version: string; sandbox: boolean }) => void;
}

declare global {
  interface Window {
    Pi?: PiSDK;
    __pi_initialized?: boolean;
  }
}

export default function PiAuthInit() {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.Pi &&
      !window.__pi_initialized
    ) {
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
