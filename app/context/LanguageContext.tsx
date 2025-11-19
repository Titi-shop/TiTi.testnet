"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";

// Import file JSON ngôn ngữ
import vi from "../locales/vi.json";
import en from "../locales/en.json";
import zh from "../locales/zh.json";

type Language = "vi" | "en" | "zh";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  translate: (key: string) => string;
  goToShop: () => void;
  goToCustomer: () => void;
}

// 👉 Tạo Context
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// 👉 Gắn JSON ngôn ngữ vào hệ thống
const translations: Record<Language, Record<string, string>> = { vi, en, zh };

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("vi");
  const router = useRouter();

  // 🔄 Khôi phục ngôn ngữ từ localStorage khi reload
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("lang") as Language | null;
      if (saved) setLanguage(saved);
    }
  }, []);

  // 🎯 Thay đổi ngôn ngữ
  const changeLanguage = (lang: Language) => {
    setLanguage(lang);
    if (typeof window !== "undefined") localStorage.setItem("lang", lang);
    router.refresh?.();
  };

  // 🚀 Điều hướng
  const goToShop = () => router.push("/shop");
  const goToCustomer = () => router.push("/customer");

  // 🔍 Hàm dịch
  const translate = (key: string): string => translations[language][key] || key;

  return (
    <LanguageContext.Provider
      value={{ language, setLanguage: changeLanguage, translate, goToShop, goToCustomer }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

// 📌 Hook sử dụng nhanh trong các component
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
}
