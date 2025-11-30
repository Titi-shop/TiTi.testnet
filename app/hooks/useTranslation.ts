"use client";

import { useState, useEffect } from "react";
import { languages, availableLanguages } from "@/app/lib/i18n";

export function useTranslation() {
  const [lang, setLang] = useState("vi");
  const [t, setT] = useState<Record<string, string>>({});

  // Load stored language
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedLang = localStorage.getItem("lang") || "vi";
      setLang(savedLang);
    }
  }, []);

  // Load translation file dynamically
  useEffect(() => {
    languages[lang]?.().then((mod) => setT(mod.default));
  }, [lang]);

  // Sync across tabs/components
  useEffect(() => {
    const handler = (e: any) => setLang(e.detail);
    window.addEventListener("language-change", handler);
    return () => window.removeEventListener("language-change", handler);
  }, []);

  const setLanguage = (newLang: string) => {
    localStorage.setItem("lang", newLang);
    setLang(newLang);
    window.dispatchEvent(new CustomEvent("language-change", { detail: newLang }));
  };

  return { t, lang, setLang: setLanguage, availableLanguages };
}
