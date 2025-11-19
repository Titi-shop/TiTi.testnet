"use client";
import { useRouter, usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';

export default function LocaleSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();

  const changeLanguage = (newLocale: string) => {
    router.push(`/${newLocale}${pathname.substring(3)}`);
  };

  return (
    <select
      value={locale}
      onChange={(e) => changeLanguage(e.target.value)}
      className="border p-2 mt-4 rounded"
    >
      <option value="vi">🇻🇳 Tiếng Việt</option>
      <option value="en">🇬🇧 English</option>
      <option value="zh">🇨🇳 中文</option>
    </select>
  );
}
