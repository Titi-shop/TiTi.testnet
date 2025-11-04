import { NextResponse } from "next/server";
import { del } from "@vercel/blob";

/**
 * ⚠️ API đặc biệt - Xóa toàn bộ file products.json
 * Chỉ chạy một lần khi cần reset dữ liệu.
 */

export async function GET() {
  try {
    await del("products.json");
    return NextResponse.json({ success: true, message: "Đã xóa toàn bộ dữ liệu sản phẩm." });
  } catch (err: any) {
    console.error("❌ Lỗi xóa products.json:", err);
    return NextResponse.json({ success: false, error: err.message });
  }
}
