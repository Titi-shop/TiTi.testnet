"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslation, availableLanguages } from "@/app/lib/i18n";

export default function Navbar() {
  const { t, lang, setLang } = useTranslation();
  const router = useRouter();

  return (
    <header className="bg-orange-500 p-3 text-white flex justify-between items-center">

      <Link href="/cart">{t.cart || "Cart"}</Link>

      <div className="flex items-center gap-3">
        <button onClick={() => router.push("/search")}>
          {t.search || "Search"}
        </button>

        <select
          value={lang}
          onChange={(e) => setLang(e.target.value)}
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
