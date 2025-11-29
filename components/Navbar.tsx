"use client";
import { ShoppingCart, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/app/lib/i18n";

export default function Navbar() {
  const { t, lang, changeLang } = useTranslation();
  const router = useRouter();

  const toggleLang = () => {
    const nextLang = lang === "vi" ? "en" : lang === "en" ? "zh" : "vi";
    changeLang(nextLang); // 👈 Không dùng setLang, phải dùng changeLang
  };

  return (
    <header className="bg-orange-500 p-3 flex justify-between text-white">
      <Link href="/cart" aria-label={t.cart}>
        <ShoppingCart size={22} />
      </Link>

      <button onClick={() => router.push("/search")}>{t.search}</button>

      <button onClick={toggleLang}>
        {lang === "vi" ? "🇻🇳" : lang === "en" ? "🇬🇧" : "🇨🇳"}
      </button>
    </header>
  );
}
