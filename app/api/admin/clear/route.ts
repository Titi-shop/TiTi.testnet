export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { del, list } from "@vercel/blob";

/**
 * =========================================
 * 🧹 API: /api/admin/clear
 * -----------------------------------------
 * ✅ Dành cho admin reset dữ liệu testnet
 * ✅ Xóa orders, products, users test
 * ✅ Có kiểm tra ADMIN_KEY bảo mật
 * ✅ Giữ nguyên dữ liệu mainnet
 * =========================================
 */

const ADMIN_KEY = process.env.ADMIN_KEY || "admin123"; // 🔐 thay khi deploy

const isTestnet =
  process.env.NEXT_PUBLIC_PI_ENV === "testnet" ||
  process.env.PI_API_URL?.includes("/sandbox");

export async function POST(req: Request) {
  try {
    const { key } = await req.json();

    if (key !== ADMIN_KEY) {
      return NextResponse.json(
        { success: false, error: "🚫 Không có quyền thực thi" },
        { status: 403 }
      );
    }

    if (!isTestnet) {
      return NextResponse.json({
        success: false,
        message: "❌ Chỉ được phép xoá dữ liệu trong testnet!",
      });
    }

    // 🧾 Xoá dữ liệu đơn hàng test
    await kv.del("orders");

    // 👥 Xoá danh sách người dùng test
    await kv.del("user_list:testnet");

    // 📦 Xoá role test
    const keys = await kv.keys("user_role:testnet:*");
    for (const k of keys) await kv.del(k);

    // 🛍️ Xoá file products.json test
    const { blobs } = await list();
    const file = blobs.find((b) => b.pathname === "products.json");
    if (file) await del("products.json");

    console.log("🧹 Dữ liệu testnet đã được reset hoàn toàn.");

    return NextResponse.json({
      success: true,
      message: "🧹 Đã xóa toàn bộ dữ liệu testnet.",
    });
  } catch (err: any) {
    console.error("❌ Lỗi /api/admin/clear:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
