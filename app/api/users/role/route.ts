export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

/**
 * 🟣 API: /api/users/role
 * - Phân quyền người dùng (seller / buyer)
 * - Không phân biệt chữ hoa/thường
 * - Tự động set role seller cho người trong danh sách mặc định
 */

const DEFAULT_SELLERS = ["nguyenminhduc1991111", "vothao11996611"];

function normalize(str: string): string {
  return str.trim().toLowerCase();
}

export async function POST(req: Request) {
  try {
    const { username, role } = await req.json();
    if (!username || !role)
      return NextResponse.json({ error: "Thiếu dữ liệu" }, { status: 400 });

    const normalized = normalize(username);
    const key = `user_role:${normalized}`;

    if (!["seller", "buyer"].includes(role))
      return NextResponse.json({ error: "Role không hợp lệ" }, { status: 400 });

    await kv.set(key, role);
    return NextResponse.json({ success: true, username: normalized, role });
  } catch (err: any) {
    console.error("❌ Lỗi lưu quyền:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username");
    if (!username)
      return NextResponse.json({ error: "Thiếu username" }, { status: 400 });

    const normalized = normalize(username);
    const key = `user_role:${normalized}`;

    let role = (await kv.get<string>(key)) || "buyer";

    if (DEFAULT_SELLERS.some((u) => normalize(u) === normalized)) {
      role = "seller";
      await kv.set(key, role);
    }

    return NextResponse.json({ success: true, username: normalized, role });
  } catch (err: any) {
    console.error("❌ Lỗi GET role:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
