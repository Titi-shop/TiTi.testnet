"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <main className="p-6 text-center">
      <h1 className="text-2xl font-bold">404 - Page not found</h1>
      <p>Trang bạn tìm không tồn tại hoặc đã bị xóa.</p>
      <Link href="/" className="text-orange-500 underline mt-2 block">
        ← Quay lại trang chủ
      </Link>
    </main>
  );
}
