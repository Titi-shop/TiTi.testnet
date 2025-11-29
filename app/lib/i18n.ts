"use client";

import { useState, useEffect } from "react";

const languages: Record<string, any> = {
  vi: () => import("@/messages/vi.json"),
  en: () => import("@/messages/en.json"),
  zh: () => import("@/messages/zh.json"),
};

export function useTranslation() {
  const [lang, setLang] = useState<string>("vi");
  const [t, setT] = useState<any>({});

  // ⬅ Lần đầu load ngôn ngữ từ localStorage
  useEffect(() => {
    const savedLang = localStorage.getItem("lang") || "vi";
    setLang(savedLang);
    loadLanguage(savedLang);
  }, []);

  // ⬅ Khi lang thay đổi thì load ngôn ngữ mới
  useEffect(() => {
    loadLanguage(lang);
    localStorage.setItem("lang", lang);
  }, [lang]);

  const loadLanguage = async (lng: string) => {
    if (languages[lng]) {
      const mod = await languages[lng]();
      setT(mod.default);
    }
  };

  // ⬅ Đây là hàm đổi ngôn ngữ thật sự
  const changeLang = (lng: string) => {
    setLang(lng);
  };

  return { t, lang, changeLang };
}
