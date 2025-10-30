"use client";
import { useEffect, useState } from "react";

export default function PiStatus() {
  const [status, setStatus] = useState("⏳ Đang tải Pi SDK...");

  useEffect(() => {
    const check = setInterval(() => {
      if (typeof window !== "undefined" && (window as any).Pi) {
        setStatus("✅ Pi SDK đã load!");
        clearInterval(check);
      }
    }, 1000);
    return () => clearInterval(check);
  }, []);

  return <div className="text-center mt-4">{status}</div>;
}
