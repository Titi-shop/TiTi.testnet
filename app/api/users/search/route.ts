import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

function normalize(str: string) {
  return str?.trim().toLowerCase();
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = normalize(searchParams.get("q") || "");

    if (!q) return NextResponse.json([]);

    // 📌 Lấy danh sách tất cả usernames đã đăng ký
    const allUsers = await kv.smembers<string>("users:all"); // ["admin", "titi99", "duc111"]

    if (!allUsers || allUsers.length === 0) return NextResponse.json([]);

    // 📌 Tìm user phù hợp
    const matchedUsers = [];

    for (const username of allUsers) {
      const profile = await kv.get<any>(`user_profile:${username}`);
      if (!profile) continue;

      if (
        username.includes(q) ||
        profile.appName?.toLowerCase().includes(q)
      ) {
        matchedUsers.push({
          username,
          appName: profile.appName || username,
          avatar: profile.avatar || null,
        });
      }
    }

    return NextResponse.json(matchedUsers);
  } catch (err) {
    console.error("Search API Error", err);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
