"use client";

import { useState, useEffect } from "react";

export default function LanguageSwitcher() {
  const [lang, setLang] = useState<string>("vi");

  useEffect(() => {
    const savedLang = localStorage.getItem("lang") || "vi";
    setLang(savedLang);
  }, []);

  const changeLang = (newLang: string) => {
    localStorage.setItem("lang", newLang);
    window.location.reload();
  };

  return (
    <select
      value={lang}
      onChange={(e) => changeLang(e.target.value)}
      className="border p-2 rounded text-sm bg-white"
    >
      <option value="vi">🇻🇳 Tiếng Việt</option>
      <option value="en">🇬🇧 English</option>
      <option value="zh">🇨🇳 中文</option>
    </select>
  );
}
