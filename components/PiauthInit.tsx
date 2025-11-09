"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    Pi?: any;
  }
}

export default function PiAuthInit() {
  useEffect(() => {
    if (typeof window === "undefined" || !window.Pi) return;

    const Pi = window.Pi;
    Pi.init({ version: "2.0" });

    async function authenticate() {
      try {
        const scopes = ["username", "payments"];
        const authResult = await Pi.authenticate(scopes, (payment: any) => {
          console.log("Incomplete payment found:", payment);
        });

        if (authResult?.user?.username) {
          const uname = authResult.user.username.toLowerCase().trim();
          localStorage.setItem("username", uname);
          console.log("✅ Pi user:", uname);
        }
      } catch (error) {
        console.error("❌ Pi login failed:", error);
      }
    }

    authenticate();
  }, []);

  return null;
}
