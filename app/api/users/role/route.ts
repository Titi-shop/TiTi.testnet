export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

/**
 * =========================================
 * 👤 API: /api/users/role
 * -----------------------------------------
 * ✅ Phân quyền người dùng (seller / buyer)
 * ✅ Hoạt động tốt cho cả testnet & mainnet
 * ✅ Dữ liệu tách biệt giữa 2 môi trường
 * ✅ Cho phép testnet auto-seller
 * =========================================
 */

// 🔹 Phát hiện môi trường (testnet hoặc mainnet)
const isTestnet =
  process.env.NEXT_PUBLIC_PI_ENV === "testnet" ||
  process.env.PI_API_URL?.includes("/sandbox");

// 🔸 Danh sách người bán mặc định
const DEFAULT_SELLERS = ["nguyenminhduc1991111", "vothao11996611"];

// 🔸 Chuẩn hoá username (xoá khoảng trắng, viết thường)
function normalize(str: string): string {
  return str.trim().toLowerCase();
}

// ----------------------------
// 🔹 POST: Gán quyền cho user
// ----------------------------
export async function POST(req: Request) {
  try {
    const { username, role } = await req.json();

    if (!username || !role)
      return NextResponse.json({ error: "Thiếu dữ liệu" }, { status: 400 });

    const normalized = normalize(username);
    const envPrefix = isTestnet ? "testnet" : "mainnet";
    const key = `user_role:${envPrefix}:${normalized}`;

    if (!["seller", "buyer"].includes(role))
      return NextResponse.json(
        { error: "Role không hợp lệ" },
        { status: 400 }
      );

    await kv.set(key, role);

    console.log(`✅ [${envPrefix}] Gán role cho ${normalized}: ${role}`);

    return NextResponse.json({ success: true, username: normalized, role, env: envPrefix });
  } catch (err: any) {
    console.error("❌ Lỗi lưu quyền:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

// ----------------------------
// 🔹 GET: Lấy quyền của user
// ----------------------------
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username");

    if (!username)
      return NextResponse.json({ error: "Thiếu username" }, { status: 400 });

    const normalized = normalize(username);
    const envPrefix = isTestnet ? "testnet" : "mainnet";
    const key = `user_role:${envPrefix}:${normalized}`;

    // 🔸 Auto seller trong testnet để dễ test
    if (isTestnet) {
      console.log(`🧪 [TESTNET] Auto gán seller cho ${normalized}`);
      await kv.set(key, "seller");
      return NextResponse.json({
        success: true,
        username: normalized,
        role: "seller",
        env: envPrefix,
      });
    }

    // 🔸 Lấy role từ KV (hoặc mặc định là buyer)
    let role = (await kv.get<string>(key)) || "buyer";

    // 🔸 Nếu user trong danh sách mặc định → ép role seller
    if (DEFAULT_SELLERS.some((u) => normalize(u) === normalized)) {
      role = "seller";
      await kv.set(key, role);
    }

    console.log(`👤 [${envPrefix}] Role của ${normalized}: ${role}`);

    return NextResponse.json({
      success: true,
      username: normalized,
      role,
      env: envPrefix,
    });
  } catch (err: any) {
    console.error("❌ Lỗi GET role:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
