"use client";

import { useState, useEffect } from "react";

const languages: Record<string, any> = {
  vi: () => import("@/messages/vi.json"),
  en: () => import("@/messages/en.json"),
  zh: () => import("@/messages/zh.json"),
};

export function useTranslation() {
  const [lang, setLang] = useState("vi");
  const [t, setT] = useState<any>({});

  // Load ngôn ngữ từ localStorage
  useEffect(() => {
    const savedLang = localStorage.getItem("lang") || "vi";
    setLang(savedLang);
  }, []);

  // Load file JSON tương ứng khi lang thay đổi
  useEffect(() => {
    if (languages[lang]) {
      languages[lang]().then((mod) => setT(mod.default));
      localStorage.setItem("lang", lang);
    }
  }, [lang]);

  return { t, lang, setLang }; // 👉 Quan trọng: phải trả cả setLang
}
