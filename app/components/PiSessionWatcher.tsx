"use client";
import { useEffect } from "react";

export default function PiSessionWatcher() {
  useEffect(() => {
    const handleUserUpdate = () => {
      const piUser = localStorage.getItem("pi_user");
      const username = localStorage.getItem("titi_username");
      console.log("🟢 Pi session updated:", piUser || username);
    };

    // Khi user đăng nhập hoặc thay đổi — tự trigger
    window.addEventListener("pi-user-updated", handleUserUpdate);

    // Khi load lần đầu — kiểm tra xem có đăng nhập sẵn không
    const piUser = localStorage.getItem("pi_user");
    if (piUser) {
      window.dispatchEvent(new Event("pi-user-updated"));
    }

    return () => {
      window.removeEventListener("pi-user-updated", handleUserUpdate);
    };
  }, []);

  return null;
}
