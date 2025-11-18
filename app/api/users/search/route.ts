import { NextResponse } from "next/server";
import { kv } from "@vercel/kv"; // nếu bạn lưu user ở KV
// hoặc fetch từ MongoDB nếu dùng database khác

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.toLowerCase();

  if (!q) return NextResponse.json([]);

  // Giả sử bạn lưu danh sách username ở KV key: "users:all"
  const allUsers = await kv.smembers("users:all"); // ["admin", "abc111", "titi99"]

  const found = allUsers.filter((u) => u.includes(q));

  return NextResponse.json(found);
}
