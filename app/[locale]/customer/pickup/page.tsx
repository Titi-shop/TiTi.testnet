"use client";
import { useTranslations } from 'next-intl';

export default function PickupPage() {
  const t = useTranslations('Pickup');

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">{t('title')}</h1>
      <p>{t('no_orders')}</p>
    </main>
  );
}
