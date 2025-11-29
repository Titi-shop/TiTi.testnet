// app/lib/i18n.ts
"use client";

import { useState, useEffect } from "react";

export const availableLanguages = {
  vi: "🇻🇳 Tiếng Việt",
  en: "🇬🇧 English",
  zh: "🇨🇳 中文",
};

const languages: Record<string, any> = {
  vi: () => import("@/messages/vi.json"),
  en: () => import("@/messages/en.json"),
  zh: () => import("@/messages/zh.json"),
};

export function useTranslation() {
  const [lang, setLang] = useState("vi");
  const [t, setT] = useState<any>({});

  useEffect(() => {
    const savedLang = localStorage.getItem("lang") || "vi";
    setLang(savedLang);
  }, []);

  useEffect(() => {
    if (languages[lang]) {
      languages[lang]().then((mod) => setT(mod.default));
      localStorage.setItem("lang", lang);
    }
  }, [lang]);

  return { t, lang, setLang };
}
