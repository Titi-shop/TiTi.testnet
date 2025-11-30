"use client";

import { useState, useEffect } from "react";

export const availableLanguages = {
  vi: "🇻🇳 Tiếng Việt",
  en: "🇬🇧 English",
  zh: "🇨🇳 中文",
};

const languages: Record<string, () => Promise<{ default: Record<string, string> }>> = {
  vi: () => import("@/messages/vi.json"),
  en: () => import("@/messages/en.json"),
  zh: () => import("@/messages/zh.json"),
};

export function useTranslation() {
  const [lang, setLang] = useState("vi");
  const [t, setT] = useState<Record<string, string>>({});

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedLang = localStorage.getItem("lang") || "vi";
      setLang(savedLang);
    }
  }, []);

  useEffect(() => {
    languages[lang]?.().then((mod) => setT(mod.default));
  }, [lang]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = (e: any) => setLang(e.detail);
    window.addEventListener("language-change", handler);
    return () => window.removeEventListener("language-change", handler);
  }, []);

  const setLanguage = (newLang: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("lang", newLang);
      setLang(newLang);
      window.dispatchEvent(new CustomEvent("language-change", { detail: newLang }));
    }
  };

  return { t, lang, setLang: setLanguage };
}
