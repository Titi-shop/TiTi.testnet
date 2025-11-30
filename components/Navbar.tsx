"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import { useTranslation, availableLanguages } from "@/app/lib/i18n";

export default function Navbar() {
  const { t, lang, setLang } = useTranslation();
  const router = useRouter();

  const changeLang = (newLang: string) => {
    setLang(newLang); // Cập nhật ngôn ngữ ngay
    localStorage.setItem("lang", newLang); // Lưu lại
  };

  return (
    <header className="bg-orange-500 p-3 text-white flex justify-between">

      {/* Cart */}
      <Link href="/cart">{t.cart || "Cart"}</Link>

      <div className="flex items-center gap-3">
        <button onClick={() => router.push("/search")}>
          {t.search || "Search"}
        </button>

        {/* Dropdown chọn ngôn ngữ */}
        <select
          value={lang}
          onChange={(e) => changeLang(e.target.value)}
          className="bg-white text-black text-xs px-2 py-1 rounded"
        >
          {Object.entries(availableLanguages).map(([code, label]) => (
            <option key={code} value={code}>
              {label}
            </option>
          ))}
        </select>
      </div>
    </header>
  );
}
