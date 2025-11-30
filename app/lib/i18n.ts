"use client";

import { useState, useEffect } from "react";

export const availableLanguages = {
  vi: "🇻🇳 Tiếng Việt",
  en: "🇬🇧 English",
  zh: "🇨🇳 中文",
};

// Import động từng file ngôn ngữ
const languages: Record<string, () => Promise<{ default: Record<string, string> }>> = {
  vi: () => import("@/messages/vi.json"),
  en: () => import("@/messages/en.json"),
  zh: () => import("@/messages/zh.json"),
};

export function useTranslation() {
  const [lang, setLang] = useState("vi");
  const [t, setT] = useState<Record<string, string>>({});

  // Lấy lang từ localStorage (chỉ khi client mount)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedLang = localStorage.getItem("lang") || "vi";
    setLang(savedLang);
  }, []);

  // Khi ngôn ngữ thay đổi -> load JSON tương ứng
  useEffect(() => {
    if (!languages[lang]) return;
    languages[lang]().then((mod) => {
      setT(mod.default || {});
      if (typeof window !== "undefined") {
        localStorage.setItem("lang", lang);
      }
    });
  }, [lang]);

  return { t, lang, setLang };
}
