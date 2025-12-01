export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

/**
 * =========================================
 * 👥 API: /api/users/list
 * -----------------------------------------
 * ✅ Liệt kê toàn bộ user và role
 * ✅ Hoạt động cho cả testnet & mainnet
 * ✅ Hỗ trợ lọc theo role (seller/buyer)
 * ✅ Chỉ hiển thị dữ liệu theo môi trường
 * ✅ Có thể giới hạn quyền bằng ENV key
 * =========================================
 */

const ADMIN_KEY = process.env.ADMIN_KEY || "admin123"; // 🔐 đổi khi deploy thật

const isTestnet =
  process.env.NEXT_PUBLIC_PI_ENV === "testnet" ||
  process.env.PI_API_URL?.includes("/sandbox");

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");
    const roleFilter = searchParams.get("role"); // "seller" | "buyer"

    // 🔒 Bảo mật cơ bản
    if (key !== ADMIN_KEY) {
      return NextResponse.json(
        { success: false, error: "🚫 Không có quyền truy cập" },
        { status: 403 }
      );
    }

    // Lấy tất cả keys trong KV
    const envPrefix = isTestnet ? "testnet" : "mainnet";
    const pattern = `user_role:${envPrefix}:`;

    // 👉 Vercel KV không có list() filter trực tiếp,
    // nên ta dùng trick nhỏ: lưu danh sách username riêng
    const allUsers =
      (await kv.get<string[]>(`user_list:${envPrefix}`)) || [];

    const result: any[] = [];

    for (const username of allUsers) {
      const role = (await kv.get<string>(`${pattern}${username}`)) || "buyer";
      if (roleFilter && role !== roleFilter) continue;
      result.push({ username, role });
    }

    return NextResponse.json({
      success: true,
      env: envPrefix,
      total: result.length,
      users: result,
    });
  } catch (err: any) {
    console.error("❌ Lỗi /api/users/list:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

/**
 * Gợi ý thêm:
 * 👉 Khi người dùng login thành công (trong AuthContext),
 * bạn có thể gọi POST /api/users/register
 * để lưu username vào danh sách KV `user_list:${env}`
 * (đoạn đó mình có thể viết sẵn nếu bạn muốn).
 */
