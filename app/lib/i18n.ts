"use client";

import { useState, useEffect } from "react";

export const availableLanguages = {
  vi: "🇻🇳 Tiếng Việt",
  en: "🇬🇧 English",
  zh: "🇨🇳 中文",
  ko: "🇰🇷 한국어",
  th: "🇹🇭 ภาษาไทย",
  fr: "🇫🇷 Français",
  ar: "🇸🇦 العربية",
  ru: "🇷🇺 Русский",
  de: "🇩🇪 Deutsch",
  pt: "🇵🇹 Português",
  hi: "🇮🇳 हिन्दी",
  ja: "🇯🇵 日本語",
  mr: "🇮🇳 मराठी",
};

const languages: Record<string, () => Promise<{ default: Record<string, string> }>> = {
  const languages = {
  vi: () => import("@/messages/vi.json"),
  en: () => import("@/messages/en.json"),
  zh: () => import("@/messages/zh.json"),
  ko: () => import("@/messages/ko.json"),
  th: () => import("@/messages/th.json"),
  fr: () => import("@/messages/fr.json"),
  ar: () => import("@/messages/ar.json"),
  ru: () => import("@/messages/ru.json"),
  de: () => import("@/messages/de.json"),
  pt: () => import("@/messages/pt.json"),
  hi: () => import("@/messages/hi.json"),
  ja: () => import("@/messages/ja.json"),
  mr: () => import("@/messages/mr.json"),
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
