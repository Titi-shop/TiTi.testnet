"use client";

import { useState, useEffect } from "react";

// Import tất cả file JSON tự động
const languages: Record<string, any> = {
  vi: () => import("@/messages/vi.json"),
  en: () => import("@/messages/en.json"),
  zh: () => import("@/messages/zh.json"),
  // 👉 chỉ cần thêm dòng ở đây nếu có ngôn ngữ mới
};

export function useTranslation() {
  const [lang, setLang] = useState("vi");
  const [t, setT] = useState<any>({});

  useEffect(() => {
    const savedLang = localStorage.getItem("lang") || "vi";
    setLang(savedLang);

    if (languages[savedLang]) {
      languages[savedLang]().then((mod) => setT(mod.default));
    }
  }, []);

  return { t, lang };
}
