"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";

export default function PiLoginPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, piReady, pilogin, loading } = useAuth();

  const [status, setStatus] = useState(t.loading_initial);
  const [agreed, setAgreed] = useState(false);

  // ✅ Redirect nếu đã đăng nhập
  useEffect(() => {
    if (user) {
      setStatus(`${t.welcome} ${user.username}`);
      setTimeout(() => router.push("/customer"), 1200);
    } else if (!loading) {
      setStatus("");
    }
  }, [user, loading, router, t]);

  // ✅ Xử lý đăng nhập
  const handleLogin = async () => {
    if (!agreed) {
      setStatus(t.must_agree_terms);
      return;
    }

    if (!piReady) {
      setStatus(t.pi_not_ready);
      return;
    }

    setStatus(t.authenticating);
    await pilogin();
  };

  if (loading) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen text-gray-500">
         {t.checking_session}
      </main>
    );
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-white text-center px-6 relative">
      {status && (
        <p className="text-gray-700 text-sm absolute top-[35%] whitespace-pre-line">
          {status}
        </p>
      )}

      <div className="flex flex-col items-center justify-center space-y-4 mt-[-60px]">
        <button
          onClick={handleLogin}
          disabled={!piReady || !agreed}
          className={`${
            piReady && agreed
              ? "bg-orange-500 hover:bg-orange-600"
              : "bg-gray-300 cursor-not-allowed"
          } text-white font-semibold py-3 px-10 rounded-full text-lg shadow-md transition-all duration-200`}
        >
          {t.login}
        </button>

        <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
          <input
            type="checkbox"
            id="agree"
            checked={agreed}
            onChange={() => setAgreed(!agreed)}
            className="w-4 h-4 accent-orange-500 cursor-pointer"
          />
          <label htmlFor="agree" className="select-none">
            {t.i_agree}{" "}
            <a
              href="https://www.termsfeed.com/live/7eae894b-14dd-431c-99da-0f94cab5b9ac"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-500 underline"
            >
              《{t.terms_of_use}》
            </a>{" "}
            {t.and}{" "}
            <a
              href="https://www.termsfeed.com/live/32e8bf86-ceaf-4eb6-990e-cd1fa0b0775e"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-500 underline"
            >
              《{t.privacy_policy}》
            </a>
          </label>
        </div>
      </div>

      <footer className="absolute bottom-6 text-gray-400 text-xs">
        © 1Pi.app 2023 — {t.all_rights_reserved}
      </footer>
    </main>
  );
}
