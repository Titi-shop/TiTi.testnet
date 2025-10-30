"use client";

import { useEffect } from "react";

export default function PiProvider() {
  useEffect(() => {
    if (typeof window !== "undefined" && window.Pi) {
      window.Pi.init({ version: "2.0", sandbox: true });
      console.log("✅ Pi SDK initialized");
    } else {
      console.warn("⚠️ Pi SDK not found");
    }
  }, []);

  return null;
}
