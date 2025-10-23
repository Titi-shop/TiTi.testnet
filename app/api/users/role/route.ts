import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

/**
 * 🟣 API: /api/users/role
 * Lưu & lấy thông tin phân quyền người dùng (seller / buyer)
 */

export async function POST(req: Request) {
  try {
    const { username, role } = await req.json();

    if (!username || !role)
      return NextResponse.json({ error: "missing data" }, { status: 400 });

    // Lưu vào KV
    const key = `user_role:${username.toLowerCase()}`;
    await kv.set(key, role);

    return NextResponse.json({ success: true, username, role });
  } catch (err: any) {
    console.error("❌ Lỗi lưu quyền:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get("username");

  if (!username)
    return NextResponse.json({ error: "missing username" }, { status: 400 });

  const key = `user_role:${username.toLowerCase()}`;
  const role = (await kv.get(key)) || "buyer";

  return NextResponse.json({ username, role });
}
