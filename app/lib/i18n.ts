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

  // Load language initially
  useEffect(() => {
    const savedLang = localStorage.getItem("lang") || "vi";
    setLang(savedLang);
  }, []);

  // Load translation file
  useEffect(() => {
    languages[lang]?.().then((mod) => setT(mod.default));
  }, [lang]);

  // Listen for language-change events to update all components
  useEffect(() => {
    const handler = (e: any) => setLang(e.detail);
    window.addEventListener("language-change", handler);
    return () => window.removeEventListener("language-change", handler);
  }, []);

  // Hàm đổi ngôn ngữ toàn app
  const setLanguage = (newLang: string) => {
    localStorage.setItem("lang", newLang);
    setLang(newLang);
    window.dispatchEvent(new CustomEvent("language-change", { detail: newLang }));
  };

  return { t, lang, setLang: setLanguage };
}
