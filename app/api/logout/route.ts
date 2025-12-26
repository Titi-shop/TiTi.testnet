import { NextResponse } from "next/server";

/**
 * 🧹 API: /api/logout
 * - Xóa thông tin người dùng trong client (localStorage)
 * - Dành cho gọi từ frontend (POST request)
 * - Có thể mở rộng để clear session server-side trong tương lai
 */

export async function POST() {
  try {
    // Trong môi trường serverless (Vercel), không có session thật,
    // nên chỉ cần trả tín hiệu để frontend tự xoá localStorage
    return NextResponse.json({ success: true, message: "Đăng xuất thành công!" });
  } catch (error: unknown) {
    console.error("❌ Lỗi khi xử lý logout:", error);

    return NextResponse.json(
      { success: false, message: "Lỗi đăng xuất." },
      { status: 500 }
    );
  }
}
