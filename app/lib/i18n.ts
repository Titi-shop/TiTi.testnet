// ❌ KHÔNG dùng "use client" ở file này

export const availableLanguages = {
  vi: "🇻🇳 Tiếng Việt",
  en: "🇬🇧 English",
  zh: "🇨🇳 中文",
};

export const languages: Record<
  string,
  () => Promise<{ default: Record<string, string> }>
> = {
  vi: () => import("@/messages/vi.json"),
  en: () => import("@/messages/en.json"),
  zh: () => import("@/messages/zh.json"),
};
